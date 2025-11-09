
# test_client.py
# Quick smoke tests for local development (no pytest needed).
# Run the server first: uvicorn app:app --reload
import requests, json

BASE = "http://127.0.0.1:8000"

def pretty(r):
    try:
        return json.dumps(r.json(), indent=2, ensure_ascii=False)
    except Exception:
        return r.text

def run():
    print("GET /missions")
    r = requests.get(f"{BASE}/missions")
    print(pretty(r), "\n")

    print("POST /points/calc")
    r = requests.post(f"{BASE}/points/calc", json={"completed_missions":["m_walk","m_veg","bad_id"]})
    print(pretty(r), "\n")

    print("POST /analyze")
    payload = {
        "mode":"petrol_car","distance_km":3,
        "meat_meals":1,"veg_meals":0,
        "electricity_kwh":2,"lpg_kg":0,"waste_kg":0.2,
        "period":"day","lang":"en"
    }
    r = requests.post(f"{BASE}/analyze", json=payload)
    print(pretty(r), "\n")

    print("GET /data/india/temp")
    r = requests.get(f"{BASE}/data/india/temp")
    print(pretty(r), "\n")

    # /explain and /agent require a valid OpenAI key in .env
    print("POST /explain (needs OPENAI key)")
    r = requests.post(f"{BASE}/explain", json={"question":"What is global warming? Keep it short.","lang":"en"})
    print(pretty(r), "\n")

    print("POST /agent (needs OPENAI key)")
    agent_body = {
        "task":"Compute my points and CO2e today.",
        "completed_missions":["m_walk","m_bag"],
        "emissions":{
            "mode":"petrol_car","distance_km":2.5,
            "meat_meals":0,"veg_meals":1,"electricity_kwh":1,
            "lpg_kg":0,"waste_kg":0.1,"period":"day"
        }
    }
    r = requests.post(f"{BASE}/agent", json=agent_body)
    print(pretty(r), "\n")

if __name__ == "__main__":
    run()
