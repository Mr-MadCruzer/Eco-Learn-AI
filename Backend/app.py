# Run:
#   pip install -r requirements.txt
#   cp .env.example .env  # then put your real OpenAI key
#   uvicorn app:app --reload

import os, json, datetime as dt
from typing import Optional, List, Dict, Any, Literal

from fastapi import FastAPI, HTTPException, Header, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv

# OpenAI
from openai import OpenAI
import xarray as xr, s3fs, numpy as np
from fastapi import Query

# India bounding box (rough): lon 68–98E, lat 6–37N
INDIA_BBOX = dict(lon_min=68, lon_max=98, lat_min=6, lat_max=37)

# One concrete file from NEX-GDDP-CMIP6 (daily tasmax “historical” for a single model)
# Tip: open the S3 index in a browser to pick a model/scenario file you like:
# https://nex-gddp-cmip6.s3.us-west-2.amazonaws.com/index.html
NEX_BUCKET_PREFIX = "s3://nex-gddp-cmip6/CMIP6/ScenarioMIP"
# Example path pattern (adjust after browsing the index):
# s3://nex-gddp-cmip6/CMIP6/CMIP/<INSTITUTION>/<MODEL>/historical/r1i1p1f1/tasmax/..."
# or
# s3://nex-gddp-cmip6/CMIP6/ScenarioMIP/<INSTITUTION>/<MODEL>/ssp245/r1i1p1f1/tasmax/...

s3 = s3fs.S3FileSystem(anon=True)

load_dotenv()

# ---------- Config ----------
SUPPORTED = {"en","hi"}  # per doc: English + Hindi (extend later)
DEFAULT_LANG = "en"

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if not OPENAI_API_KEY:
    raise RuntimeError("OPENAI_API_KEY missing. Put it in .env or export it.")
client = OpenAI(api_key=OPENAI_API_KEY)
def chat(messages, tools=None):
    """Wrapper around Chat Completions with optional tools."""
    return client.chat.completions.create(
        model="gpt-4o-mini",
        messages=messages,
        tools=tools or None,
        tool_choice="auto" if tools else None,
        temperature=0.3,
    )


FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN", "*")

app = FastAPI(title="EcoLearn+ India — Carbon Prototype", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_ORIGIN] if FRONTEND_ORIGIN != "*" else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------- Missions (static) ----------
MISSIONS: Dict[str, Dict[str, Any]] = {
    "m_walk":  {"title": "Walk instead of short car trip",     "points": 40, "co2_saving_kg": 0.15},
    "m_trans": {"title": "Use public transport today",         "points": 60, "co2_saving_kg": 0.5},
    "m_veg":   {"title": "Eat a vegetarian meal",              "points": 20, "co2_saving_kg": 2.0},
    "m_bag":   {"title": "Carry a reusable bag",               "points": 15, "co2_saving_kg": 0.05},
    "m_idle":  {"title": "Turn off idle appliances",           "points": 25, "co2_saving_kg": 0.1},
}

# ---------- Emission factors (from document + simple defaults) ----------
# Transport (kg CO2e per km)
EF_PETROL_CAR = 0.24
EF_BUS = 0.05
EF_ECAR = 0.05
EF_WALK_CYCLE = 0.0

# Meals (kg CO2e per serving)
EF_MEAT_MEAL = 2.5
EF_VEG_MEAL = 0.5

# Electricity (configurable via ENV; default if not given)
EF_ELECTRICITY_KWH = float(os.getenv("EF_ELECTRICITY_KWH", "0.82"))

# LPG / Waste (simple defaults; can be tuned later)
EF_LPG_KG = float(os.getenv("EF_LPG_KG", "2.98"))
EF_WASTE_KG = float(os.getenv("EF_WASTE_KG", "1.90"))

# Threat bands based ONLY on total CO2e for a period (arbitrary demo thresholds)
THREAT_BANDS = [
    (0,   5,   "Low"),
    (5,   15,  "Moderate"),
    (15,  40,  "High"),
    (40,  1e9, "Severe"),
]

# ---------- Schemas ----------
class MissionGenerateRequest(BaseModel):
    n: int = 5
    categories: Optional[List[str]] = None
    difficulty: Optional[str] = None
    lang: Optional[str] = None

class PointsCalcRequest(BaseModel):
    completed_missions: List[str]

class AnalyzeInput(BaseModel):
    # transport
    mode: Optional[Literal["petrol_car","bus","walk_cycle","electric_car"]] = None
    distance_km: float = 0.0
    # meals
    meat_meals: int = 0
    veg_meals: int = 0
    # home energy
    electricity_kwh: float = 0.0
    lpg_kg: float = 0.0
    # waste
    waste_kg: float = 0.0
    # language
    lang: Optional[str] = None
    # optional period label for threat calc
    period: str = "day"

class ExplainRequest(BaseModel):
    question: str
    lang: Optional[str] = None

class AgentRequest(BaseModel):
    task: str
    lang: Optional[str] = None
    emissions: Optional[AnalyzeInput] = None
    completed_missions: Optional[List[str]] = None

class LogAnalyzeRequest(BaseModel):
    text: str = Field(..., min_length=3, max_length=1000)
    lang: Optional[str] = None

# ---------- Helpers ----------
def pick_lang(accept_language: Optional[str], explicit: Optional[str]) -> str:
    if explicit:
        t = explicit.lower().split("-")[0]
        return t if t in SUPPORTED else DEFAULT_LANG
    if accept_language:
        t = accept_language.split(",")[0].strip().lower().split("-")[0]
        if t in SUPPORTED:
            return t
    return DEFAULT_LANG

def transport_factor(mode: Optional[str]) -> float:
    if mode == "petrol_car":
        return EF_PETROL_CAR
    if mode == "bus":
        return EF_BUS
    if mode == "electric_car":
        return EF_ECAR
    return EF_WALK_CYCLE

def analyze_payload(a: AnalyzeInput) -> Dict[str, Any]:
    # Transport
    t_kg = transport_factor(a.mode) * max(0.0, a.distance_km)
    # Meals
    meals_kg = a.meat_meals * EF_MEAT_MEAL + a.veg_meals * EF_VEG_MEAL
    # Energy
    elec_kg = a.electricity_kwh * EF_ELECTRICITY_KWH
    lpg_kg = a.lpg_kg * EF_LPG_KG
    # Waste
    waste_kg = a.waste_kg * EF_WASTE_KG

    total = round(t_kg + meals_kg + elec_kg + lpg_kg + waste_kg, 2)

    # Threat level from CO2e only
    label = "Low"
    for lo, hi, name in THREAT_BANDS:
        if lo <= total < hi: label = name; break

    tips = [
        "Prefer walking/cycling for short trips",
        "Use public transport for commuting",
        "Try a vegetarian meal today",
        "Set AC to 24–26°C and use fans",
        "Unplug idle chargers",
        "Carry a reusable bag and bottle",
    ]

    return {
        "breakdown": {
            "transport_kg": round(t_kg,2),
            "meals_kg": round(meals_kg,2),
            "electricity_kg": round(elec_kg,2),
            "lpg_kg": round(lpg_kg,2),
            "waste_kg": round(waste_kg,2),
        },
        "total_kg": total,
        "threat": label,
        "advice": tips,
        "period": a.period,
    }

# ---------- Log helpers ----------
DEFAULT_ACTIVITY_FACTORS: Dict[str, Any] = {
    "mode": "petrol_car",
    "distance_km": 0.0,
    "meat_meals": 0,
    "veg_meals": 0,
    "electricity_kwh": 0.0,
    "lpg_kg": 0.0,
    "waste_kg": 0.0,
    "period": "day",
}

def extract_activity_factors(text: str, lang: str) -> Dict[str, Any]:
    """
    Use OpenAI to convert a free-text daily log into AnalyzeInput-compatible fields.
    """
    lang_name = "Hindi" if lang == "hi" else "English"
    system = (
        f"You convert daily activity notes into carbon analysis inputs for India. "
        f"Respond ONLY in JSON. Use kilometers for distance and kilograms for weights. "
        f"Return keys: mode (petrol_car, bus, walk_cycle, electric_car), distance_km, meat_meals, veg_meals, "
        f"electricity_kwh, lpg_kg, waste_kg, period. "
        f"If information is missing set numeric fields to 0 and leave period as 'day'. "
        f"Respond in {lang_name} only when meaningful, but keep JSON keys in English."
    )
    user = json.dumps({"activity": text}, ensure_ascii=False)

    resp = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        response_format={"type": "json_object"},
        temperature=0.2,
    )
    data = json.loads(resp.choices[0].message.content or "{}")
    allowed = {
        "mode",
        "distance_km",
        "meat_meals",
        "veg_meals",
        "electricity_kwh",
        "lpg_kg",
        "waste_kg",
        "period",
    }
    factors = {k: data[k] for k in allowed if k in data}
    return factors

def build_feedback_and_tips(
    text: str,
    lang: str,
    analysis: Dict[str, Any],
    factors: Dict[str, Any],
) -> Dict[str, Any]:
    """
    Generate short feedback and tips tailored to the user's log.
    """
    lang_name = "Hindi" if lang == "hi" else "English"
    payload = {
        "activity": text,
        "analysis": {
            "threat": analysis.get("threat"),
            "total_kg": analysis.get("total_kg"),
            "period": analysis.get("period"),
            "breakdown": analysis.get("breakdown", {}),
        },
        "factors": factors,
    }
    system = (
        f"You are EcoLearn+ India, a climate coach. Respond ONLY in JSON with keys "
        f"'feedback' (string) and 'tips' (array of 1-3 short strings). "
        f"Write in {lang_name}. Reference the user's action directly and keep feedback supportive. "
        f"Tips must be actionable alternatives suitable for India. "
        f"Do not mention specific carbon numbers. Each string must stay under 28 words."
    )
    resp = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": json.dumps(payload, ensure_ascii=False)},
        ],
        response_format={"type": "json_object"},
        temperature=0.3,
    )
    data = json.loads(resp.choices[0].message.content or "{}")
    return {
        "feedback": data.get("feedback", "").strip(),
        "tips": [tip.strip() for tip in data.get("tips", []) if isinstance(tip, str) and tip.strip()],
    }

# ---------- Routes ----------
@app.get("/missions")
def missions():
    return {"missions": [{"id": k, **v} for k,v in MISSIONS.items()]}

@app.post("/missions/generate")
def generate_missions(req: MissionGenerateRequest, accept_language: Optional[str] = Header(None)):
    lang = pick_lang(accept_language, req.lang)

    # Map language code to label for clear instructions
    lang_name = "Hindi" if lang == "hi" else "English"

    system = (
        f"You create short, practical eco-missions for Indian users. "
        f"Respond ONLY in {lang_name}. "
        f"Format must be JSON with a 'missions' list. "
        f"Each mission must have: id (slug), title, category, points, and co2_saving_kg. "
        f"Keep titles short. Keep points between 5 and 50. Use realistic CO2 savings."
    )

    user_content = {
        "n": req.n,
        "categories": req.categories or ["transport", "energy", "waste", "food"],
        "difficulty": req.difficulty or "easy"
    }

    resp = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": f"Generate missions: {json.dumps(user_content)}"}
        ],
        response_format={"type": "json_object"}
    )

    missions = json.loads(resp.choices[0].message.content)
    return {"lang": lang, **missions}


@app.post("/points/calc")
def points_calc(req: PointsCalcRequest):
    valid = [m for m in req.completed_missions if m in MISSIONS]
    points = sum(MISSIONS[m]["points"] for m in valid)
    invalid = [m for m in req.completed_missions if m not in MISSIONS]
    return {"awarded_points": points, "accepted": valid, "invalid": invalid}

@app.post("/analyze")
def analyze(a: AnalyzeInput, accept_language: Optional[str] = Header(None)):
    lang = pick_lang(accept_language, a.lang)
    result = analyze_payload(a)
    return {"lang": lang, **result}

@app.post("/explain")
def explain(req: ExplainRequest, accept_language: Optional[str] = Header(None)):
    lang = pick_lang(accept_language, req.lang)
    system = (
        f"You are EcoLearn+ India, a bilingual climate tutor. Always answer in '{lang}'. "
        f"Keep explanations short and friendly; use India-relevant examples."
    )
    try:
        resp = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role":"system","content":system},
                {"role":"user","content":req.question}
            ]
        )
        answer = resp.choices[0].message.content
        return {"lang": lang, "answer": answer}
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))

@app.post("/logs/analyze")
def analyze_log(req: LogAnalyzeRequest, accept_language: Optional[str] = Header(None)):
    lang = pick_lang(accept_language, req.lang)

    factors = DEFAULT_ACTIVITY_FACTORS.copy()
    try:
        extracted = extract_activity_factors(req.text, lang)
        for key, value in extracted.items():
            if value is not None:
                factors[key] = value
    except Exception as e:
        # fall back to defaults but log the error for debugging
        print(f"[logs/analyze] factor extraction failed: {e}")

    try:
        analysis_input = AnalyzeInput(**factors)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid factors derived from text: {e}")

    analysis = analyze_payload(analysis_input)

    feedback_data = {"feedback": "", "tips": []}
    try:
        feedback_data = build_feedback_and_tips(
            req.text,
            lang,
            analysis,
            analysis_input.model_dump(),
        )
    except Exception as e:
        print(f"[logs/analyze] feedback generation failed: {e}")
        feedback_data["feedback"] = (
            f"{req.text.strip()} — अच्छा निर्णय लेने के लिए छोटे बदलाव आज़माएं।"
            if lang == "hi"
            else f'"{req.text.strip()}" — consider a lower-carbon alternative when you can.'
        )

    tips = feedback_data.get("tips") or analysis.get("advice", [])[:3]

    return {
        "lang": lang,
        "factors": analysis_input.model_dump(),
        "analysis": analysis,
        "feedback": feedback_data.get("feedback", ""),
        "tips": tips,
    }

@app.get("/data/india/temp")
def india_temp_series(
    variable: str = Query("tasmax", description="tas or tasmax"),
    scenario: str = Query("historical", description="historical or ssp245/ssp370/etc."),
    model_hint: str = Query("MIROC6", description="pick a model you see in the S3 index")
):
    """
    Returns annual mean temperature series (°C) for India using NEX-GDDP-CMIP6.
    This reads ONE file (keep it small for a prototype) and aggregates to yearly means.
    """
    # 1) Find a file by simple pattern (after you check the S3 index for the exact layout)
    # Note: When you first browse the S3 index, copy a real key here for reliability.
    # Example (you must replace this with a *real* key you see in the index):
    # key = "nex-gddp-cmip6/CMIP6/CMIP/NCC/MIROC6/historical/r1i1p1f1/{var}/..."  # <-- replace
    raise_key_help = (
        "Open https://nex-gddp-cmip6.s3.us-west-2.amazonaws.com/index.html , "
        "navigate to your desired model/scenario/variable, copy ONE .nc file key, "
        "and paste it into the code as `key` below."
    )

    # --- START: EDIT ME with a real key you select from the S3 index ---
    key = "nex-gddp-cmip6/CMIP6/CMIP/NCC/MIROC6/historical/r1i1p1f1/tasmax/gn/v20201201/tasmax_day_MIROC6_historical_r1i1p1f1_gn_2014.nc"
  # e.g., "nex-gddp-cmip6/.../historical/r1i1p1f1/tasmax/...nc"
    # --- END: EDIT ME ---

    if not key:
        raise HTTPException(500, f"No NEX key set. {raise_key_help}")

    if not s3.exists(key):
        raise HTTPException(404, f"S3 key not found: {key}")

    # 2) Open the NetCDF via fsspec/s3fs
    url = f"s3://{key}" if not key.startswith("s3://") else key
    ds = xr.open_dataset(s3.open(url), engine="netcdf4")

    # NEX variables are typically Kelvin for temperature; check variable name
    vname = variable  # "tas" or "tasmax"
    if vname not in ds:
        # Try common alternatives
        for cand in ("tas", "tasmax"):
            if cand in ds:
                vname = cand
                break
        if vname not in ds:
            raise HTTPException(500, f"Variable '{variable}' not found in dataset vars: {list(ds.data_vars)}")

    # 3) Subset India bbox (lat may be descending in some datasets)
    lat = ds["lat"] if "lat" in ds.coords else ds["latitude"]
    lon = ds["lon"] if "lon" in ds.coords else ds["longitude"]

    lat_slice = slice(INDIA_BBOX["lat_min"], INDIA_BBOX["lat_max"]) if float(lat[0]) < float(lat[-1]) \
                else slice(INDIA_BBOX["lat_max"], INDIA_BBOX["lat_min"])
    lon_slice = slice(INDIA_BBOX["lon_min"], INDIA_BBOX["lon_max"])

    ds_sub = ds[vname].sel(lat=lat_slice, lon=lon_slice)

    # 4) Convert K->°C if needed
    da = ds_sub
    if da.attrs.get("units", "").lower().startswith("k"):
        da = da - 273.15

    # 5) Aggregate daily -> annual mean over the India bbox
    #    time dimension is usually "time"
    annual = da.resample(time="1Y").mean(dim=("time","lat","lon"))

    years = [int(str(t.values)[:4]) for t in annual["time"].values]
    vals  = [float(x) for x in annual.values]

    return {"series": [{"year": y, "t_mean_c": round(v, 2)} for y, v in zip(years, vals)]}

# ---------- Agent ----------
CHAT_TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "missions_catalog",
            "description": "Return the static Eco Learn+ missions list.",
            "parameters": {"type": "object", "properties": {}, "required": []},
        },
    },
    {
        "type": "function",
        "function": {
            "name": "points_calc",
            "description": "Compute EcoPoints from completed mission IDs.",
            "parameters": {
                "type": "object",
                "properties": {
                    "completed_missions": {
                        "type": "array",
                        "items": {"type": "string"}
                    }
                },
                "required": ["completed_missions"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "analyze_co2e",
            "description": "Calculate CO2e and threat from daily routine inputs.",
            "parameters": {
                "type": "object",
                "properties": {
                    "mode": {
                        "type": "string",
                        "enum": ["petrol_car", "bus", "walk_cycle", "electric_car"],
                    },
                    "distance_km": {"type": "number"},
                    "meat_meals": {"type": "integer"},
                    "veg_meals": {"type": "integer"},
                    "electricity_kwh": {"type": "number"},
                    "lpg_kg": {"type": "number"},
                    "waste_kg": {"type": "number"},
                    "period": {"type": "string"},
                },
                "required": [],
            },
        },
    },
]


def tool_missions_catalog():
    return {"missions": [{"id": k, **v} for k,v in MISSIONS.items()]}

def tool_points_calc(completed_missions: List[str]):
    valid = [m for m in completed_missions if m in MISSIONS]
    points = sum(MISSIONS[m]["points"] for m in valid)
    invalid = [m for m in completed_missions if m not in MISSIONS]
    return {"awarded_points": points, "accepted": valid, "invalid": invalid}

def tool_analyze_co2e(payload: Dict[str, Any]):
    a = AnalyzeInput(**payload)
    return analyze_payload(a)

@app.post("/agent")
def agent(req: AgentRequest, accept_language: Optional[str] = Header(None)):
    lang = pick_lang(accept_language, req.lang)

    system = (
        f"You are EcoLearn+ India, a carbon-first assistant. "
        f"Always answer in '{lang}'. Use tools to: list missions, calculate points, "
        f"analyze CO2e, and fetch India temp series. Be concise and practical."
    )

    # build initial message list
    messages = [
        {"role": "system", "content": system},
        {"role": "user", "content": req.task},
    ]
    if req.completed_missions:
        messages.append({
            "role": "user",
            "content": f"Completed missions: {json.dumps(req.completed_missions)}"
        })
    if req.emissions:
        messages.append({
            "role": "user",
            "content": f"Emissions input: {req.emissions.model_dump()}"
        })

    # 1st model call (allows tool calls)
    resp = chat(messages, tools=CHAT_TOOLS)
    msg = resp.choices[0].message

    # If the model didn’t call tools, return the answer
    if not getattr(msg, "tool_calls", None):
        return {"lang": lang, "reply": msg.content}

    # Otherwise, execute each tool call and append tool outputs as messages
    tool_messages = []
    for call in msg.tool_calls:
        name = call.function.name
        args = json.loads(call.function.arguments or "{}")

        if name == "missions_catalog":
            out = tool_missions_catalog()
        elif name == "points_calc":
            out = tool_points_calc(args.get("completed_missions", []))
        elif name == "analyze_co2e":
            out = tool_analyze_co2e(args)
        else:
            out = {"error": "unknown tool"}

        tool_messages.append({
            "role": "tool",
            "tool_call_id": call.id,
            "content": json.dumps(out)
        })

    # 2nd model call with tool results for final answer
    messages.extend([
        msg,  # assistant message that contained the tool calls
        *tool_messages
    ])
    final = chat(messages)
    return {"lang": lang, "reply": final.choices[0].message.content}

