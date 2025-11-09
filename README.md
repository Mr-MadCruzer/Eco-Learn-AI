
# EcoLearn+ India — Carbon Prototype (Stateless, Agent-Driven)

This is a **runnable prototype** based on your hackathon document. No DB, no frontend.
React will call these endpoints.

## Endpoints

- `GET /missions` — static mission catalog (ids, eco points, approx CO₂ savings)
- `POST /points/calc` — compute EcoPoints from a list of mission IDs
- `POST /analyze` — **Daily Green Routine Tracker**: returns CO₂e breakdown, total, threat level, tips
- `POST /explain` — bilingual climate tutor using OpenAI (English/Hindi; set `"lang"`)
- `GET /data/india/temp` — **mock** India temp series (1970–2023) for charts
- `POST /agent` — agent endpoint that can call tools to perform the above tasks

## Quick start

```bash
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# put your actual OPENAI_API_KEY in .env

uvicorn app:app --reload
```

Open: http://127.0.0.1:8000/docs

## cURL tests

```bash
# Missions
curl http://localhost:8000/missions

# Points from missions
curl -X POST http://localhost:8000/points/calc \
  -H "Content-Type: application/json" \
  -d '{"completed_missions":["m_walk","m_veg","m_bag"]}'

# Analyze routine (driving + meals + electricity)
curl -X POST http://localhost:8000/analyze \
  -H "Content-Type: application/json" \
  -d '{"mode":"petrol_car","distance_km":3,"meat_meals":1,"veg_meals":0,"electricity_kwh":2,"lpg_kg":0,"waste_kg":0.2,"period":"day","lang":"en"}'

# Bilingual explain (Hindi)
curl -X POST http://localhost:8000/explain \
  -H "Content-Type: application/json" \
  -d '{"question":"ग्लोबल वार्मिंग क्या है?","lang":"hi"}'

# Mock temp series for charts
curl http://localhost:8000/data/india/temp

# Agent: ask it to compute points + CO2e using tool calls
curl -X POST http://localhost:8000/agent \
  -H "Content-Type: application/json" \
  -d '{"task":"I completed two missions and drove 3 km. How many points and what is my CO2e?","completed_missions":["m_walk","m_veg"],"emissions":{"mode":"petrol_car","distance_km":3,"meat_meals":0,"veg_meals":1,"electricity_kwh":1,"lpg_kg":0,"waste_kg":0.1}}'
```

## Notes

- Threat level is derived **only** from total CO₂e to match your request.
- `/data/india/temp` returns a **mock** time-series so your React teammate can build charts without ASDI wiring yet.
- Later, swap the mock with real ASDI readers (S3+Zarr/NetCDF) and state-specific grid intensity factors.
