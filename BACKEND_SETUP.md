# EcoLearn+ Backend Setup Guide

## 🚀 Quick Start

This guide will help you set up the Python/FastAPI backend for EcoLearn+ India separately from the React frontend.

---

## 📁 Create Backend Directory Structure

Create a new folder `ecolearn-backend/` outside your React project:

```bash
mkdir ecolearn-backend
cd ecolearn-backend
```

Create the following structure:
```
ecolearn-backend/
├── data/
│   ├── india_temp.csv
│   ├── india_co2.csv
│   └── emission_factors.json
├── main.py
├── requirements.txt
├── .env
└── README.md
```

---

## 📦 Step 1: Create `requirements.txt`

Create a file named `requirements.txt` with:

```txt
fastapi==0.104.1
uvicorn[standard]==0.24.0
openai==1.3.5
pandas==2.1.3
python-dotenv==1.0.0
python-multipart==0.0.6
pydantic==2.5.0
```

---

## 🔑 Step 2: Create `.env` File

Create `.env` in the root directory:

```env
OPENAI_API_KEY=sk-your-openai-api-key-here
ALLOWED_ORIGINS=http://localhost:8080
STATE_FILE=state.json
DATA_DIR=data
```

⚠️ **Replace `sk-your-openai-api-key-here` with your actual OpenAI API key** from https://platform.openai.com/api-keys

---

## 📊 Step 3: Create Data Files

### `data/india_temp.csv`
```csv
Year,AvgTemp
1970,23.4
1980,23.6
1990,23.8
2000,24.2
2010,24.5
2020,24.8
2023,25.0
```

### `data/india_co2.csv`
```csv
Year,CO2_Mt
2000,300
2005,320
2010,330
2015,280
2020,250
2022,270
```

### `data/emission_factors.json`
```json
{
  "transport": {
    "car_petrol": 0.24,
    "car": 0.24,
    "bike": 0.12,
    "bus": 0.05,
    "auto": 0.08,
    "metro": 0.03,
    "train": 0.04,
    "cycle": 0.0,
    "walk": 0.0,
    "electric_car": 0.05,
    "ev": 0.05
  },
  "food": {
    "meat_meal": 2.5,
    "meat": 2.5,
    "chicken": 1.5,
    "fish": 1.2,
    "veg_meal": 0.5,
    "veg": 0.5,
    "vegetable": 0.5
  },
  "energy": {
    "kwh_co2": 0.82,
    "ac_per_hour": 0.9,
    "fan_per_hour": 0.05,
    "light_per_hour": 0.06
  }
}
```

---

## 💻 Step 4: Create `main.py`

See the complete `main.py` code in the next section below.

---

## 🏃 Step 5: Install and Run

### Install Dependencies
```bash
pip install -r requirements.txt
```

### Run the Server
```bash
uvicorn main:app --reload --port 8000
```

You should see:
```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete.
```

---

## 🧪 Step 6: Test the Backend

### Test Health Check
```bash
curl http://localhost:8000/
```

Expected: `{"status":"healthy","message":"EcoLearn+ Backend API"}`

### Test AI Explain
```bash
curl -X POST http://localhost:8000/explain \
  -H "Content-Type: application/json" \
  -d '{"topic":"What is climate change?","lang":"en","user_id":"demo_user"}'
```

### Test Temperature Data
```bash
curl http://localhost:8000/data/india/temp
```

### Test Missions
```bash
curl http://localhost:8000/missions?lang=en
```

### Test Complete Mission
```bash
curl -X POST http://localhost:8000/complete \
  -H "Content-Type: application/json" \
  -d '{"mission_id":1,"user_id":"demo_user"}'
```

### Test Routine Analysis
```bash
curl -X POST http://localhost:8000/analyze \
  -H "Content-Type: application/json" \
  -d '{"activity":"Drove my car 5 km to work","user_id":"demo_user"}'
```

---

## 🔗 Connect to React Frontend

In your React frontend (`Front- End/`), update the API base URL:

1. Create `Front- End/src/config/api.ts`:
```typescript
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
```

2. Create `Front- End/.env.local`:
```env
VITE_API_URL=http://localhost:8000
```

3. Use in components:
```typescript
import { API_BASE_URL } from '@/config/api';

const response = await fetch(`${API_BASE_URL}/explain`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ topic, lang, user_id })
});
```

---

## 📚 API Endpoints Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Health check |
| POST | `/explain` | AI climate tutor |
| GET | `/data/india/temp` | Temperature data |
| GET | `/data/india/co2` | CO₂ emissions data |
| GET | `/missions` | Get missions list |
| POST | `/complete` | Complete a mission |
| POST | `/analyze` | Analyze daily routine |
| GET | `/user/{user_id}` | Get user data |
| POST | `/admin/reset/{user_id}` | Reset user data |

---

## 🐛 Troubleshooting

### "Module not found" errors
```bash
pip install -r requirements.txt --upgrade
```

### CORS errors from React
Make sure `.env` has:
```env
ALLOWED_ORIGINS=http://localhost:8080
```

### OpenAI API errors
- Check your API key is valid
- Ensure you have credits in your OpenAI account
- Check the model name is correct (gpt-3.5-turbo)

### Port already in use
```bash
uvicorn main:app --reload --port 8001
```

---

## 🚀 Deployment Options

### Option 1: Railway
1. Install Railway CLI: `npm i -g @railway/cli`
2. `railway login`
3. `railway init`
4. Add environment variables in Railway dashboard
5. `railway up`

### Option 2: Render
1. Create account at render.com
2. New Web Service → Connect your repo
3. Build Command: `pip install -r requirements.txt`
4. Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Add environment variables

### Option 3: Heroku
1. `heroku create ecolearn-backend`
2. Create `Procfile`: `web: uvicorn main:app --host 0.0.0.0 --port $PORT`
3. `git push heroku main`
4. `heroku config:set OPENAI_API_KEY=your-key`

---

## 📈 Next Steps

1. ✅ Set up the backend following steps above
2. ✅ Test all endpoints with curl or Postman
3. ✅ Update React frontend to use real API
4. ✅ Deploy backend to a hosting service
5. ✅ Update frontend API URL to production URL

---

## 💡 Tips

- Use **gpt-3.5-turbo** for cost-effective AI responses
- Upgrade to **gpt-4** for better Hindi language support
- Add caching for repeated questions to save API costs
- Monitor OpenAI usage at platform.openai.com
- Keep your `state.json` backed up (or upgrade to SQLite)

---

## 📞 Support

- OpenAI API Docs: https://platform.openai.com/docs
- FastAPI Docs: https://fastapi.tiangolo.com
- ASDI Datasets: https://registry.opendata.aws/asdi/

Good luck! 🚀
