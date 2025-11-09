
# app.py
# EcoLearn+ India — Stateless, Agent-Driven Carbon Backend (prototype)
# Based on "🌍 EcoLearn HACKATHON.docx" requirements.
# - No DB, no frontend. React team handles UI & storage.
# - Carbon-first: threat levels derived ONLY from CO2e.
# - Includes agent endpoint using OpenAI Responses API tool-calling.
#
# Endpoints
#   GET  /missions                 -> static missions
#   POST /points/calc              -> compute EcoPoints from mission IDs
#   POST /analyze                  -> Daily Green Routine Tracker (CO2e)
#   POST /explain                  -> climate tutor (bilingual via 'lang')
#   GET  /data/india/temp          -> mock temperature series for charts (swap to ASDI later)
#   POST /agent                    -> agent that can call tools: missions, points, analyze, temp series
#
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

@app.get("/data/india/temp")
def india_temp_series(
    variable: str = Query("tasmax", pattern="^(tas|tasmax)$", description="2m air temp or daily max"),
    scenario: str = Query("historical", pattern="^(historical|ssp126|ssp245|ssp370|ssp585)$"),
    model_hint: str = Query("MIROC6"),
    min_year: int = Query(1980, ge=1850, le=2100),
    max_year: int = Query(2014, ge=1850, le=2200),
):
    """
    Returns India-wide annual mean temperature series (°C) from NEX-GDDP-CMIP6 on ASDI.
    - Anonymous public read via s3fs
    - Aggregates across all daily files in the requested year range
    - Works for historical (CMIP) and SSPs (ScenarioMIP)
    """
    # 1) Build search roots
    base = "nex-gddp-cmip6/CMIP6/CMIP" if scenario == "historical" else "nex-gddp-cmip6/CMIP6/ScenarioMIP"

    # NEX uses institution_id / model_id. We only know the model; institution can vary.
    # File/dir layout is typically:
    #   {base}/{institution}/{model}/{scenario}/rX iY pZ fW/{var}/gn/vYYYYMMDD/{var}_day_{MODEL}_{SCEN}_r..._gn_YYYY.nc
    #
    # We search with wildcards for institution, ensemble, version, and year.
    # We'll open multiple years (mfdataset) to build an annual time series.
    file_glob = (
        f"{base}/*/{model_hint}/{scenario}/r*/{variable}/gn/*/"
        f"{variable}_day_{model_hint}_{scenario}_r*_gn_*.nc"
    )

    # 2) Find matching keys; if none, try swapping tas<->tasmax once
    keys = s3.glob(file_glob)
    if not keys:
        alt_var = "tas" if variable == "tasmax" else "tasmax"
        alt_glob = file_glob.replace(f"/{variable}/", f"/{alt_var}/").replace(f"{variable}_day_", f"{alt_var}_day_")
        keys = s3.glob(alt_glob)
        if keys:
            variable = alt_var  # we actually found the alt variable

    if not keys:
        raise HTTPException(
            status_code=404,
            detail={
                "msg": "No matching NEX-GDDP-CMIP6 files found for your filters.",
                "tried_glob": file_glob,
                "hint": "Check variable (tas/tasmax), model_hint (e.g., MIROC6), and scenario (historical/ssp245/ssp370/ssp585).",
            },
        )

    # 3) Filter by requested year range using filenames' trailing _YYYY.nc
    def key_year(k: str) -> Optional[int]:
        try:
            y = k.rsplit("_", 1)[-1].replace(".nc", "")
            return int(y)
        except Exception:
            return None

    keys_yeared = [(k, key_year(k)) for k in keys]
    keys_range = [k for k, y in keys_yeared if y is not None and min_year <= y <= max_year]
    if not keys_range:
        raise HTTPException(
            status_code=404,
            detail={
                "msg": "No files in the requested year range.",
                "year_range": [min_year, max_year],
                "available_years_sample": sorted({y for _, y in keys_yeared if y is not None})[:10],
            },
        )

    # 4) Open multiple years; supply anon storage options
    # Use engine='netcdf4' which works well with NEX-GDDP files; no dask here to keep it simple.
    # Note: you can switch to chunks / dask if memory is tight.
    s3_urls = [("s3://" + k) if not k.startswith("s3://") else k for k in sorted(keys_range)]
    try:
        ds = xr.open_mfdataset(
            s3_urls,
            engine="netcdf4",
            combine="by_coords",
            backend_kwargs={"storage_options": {"anon": True}},
            decode_times=True,
        )
    except Exception as e:
        raise HTTPException(500, f"Failed to open dataset(s): {e}")

    # 5) Pick temperature var present in the dataset
    vname = variable if variable in ds.data_vars else ("tas" if "tas" in ds.data_vars else "tasmax" if "tasmax" in ds.data_vars else None)
    if not vname:
        raise HTTPException(500, f"Temperature variable not found. Vars present: {list(ds.data_vars)}")

    # 6) Subset India bbox (lat might be ascending or descending)
    lat_name = "lat" if "lat" in ds.coords else ("latitude" if "latitude" in ds.coords else None)
    lon_name = "lon" if "lon" in ds.coords else ("longitude" if "longitude" in ds.coords else None)
    if not lat_name or not lon_name:
        raise HTTPException(500, f"Latitude/longitude coords not found. Coords present: {list(ds.coords)}")

    lat = ds[lat_name]
    lon = ds[lon_name]
    lat_slice = slice(INDIA_BBOX["lat_min"], INDIA_BBOX["lat_max"]) if float(lat[0]) < float(lat[-1]) \
                else slice(INDIA_BBOX["lat_max"], INDIA_BBOX["lat_min"])
    lon_slice = slice(INDIA_BBOX["lon_min"], INDIA_BBOX["lon_max"])

    da = ds[vname].sel({lat_name: lat_slice, lon_name: lon_slice})

    # 7) Convert Kelvin -> Celsius if needed
    units = (da.attrs.get("units", "") or "").lower()
    if units.startswith("k"):
        da = da - 273.15

    # 8) Annual India-mean
    # Note: resample('1Y') uses year-end labels; groupby('time.year') is clearer for labeling.
    # We average spatially and temporally per calendar year.
    da_year = da.groupby("time.year").mean(dim=("time", lat_name, lon_name))

    years = [int(y) for y in da_year["year"].values]
    vals = [float(v) for v in da_year.values]
    series = [{"year": y, "t_mean_c": round(v, 3)} for y, v in zip(years, vals)]

    return {
        "variable": vname,
        "scenario": scenario,
        "model": model_hint,
        "bbox": INDIA_BBOX,
        "units": "°C",
        "series": series,
        "files_used": len(s3_urls),
    }


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
    {
        "type": "function",
        "function": {
            "name": "india_temp_series",
            "description": "Return mock India annual mean temperature series (1970–2023) for charts.",
            "parameters": {"type": "object", "properties": {}, "required": []},
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

def tool_india_temp_series():
    return india_temp_series()

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
        elif name == "india_temp_series":
            out = tool_india_temp_series()
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

