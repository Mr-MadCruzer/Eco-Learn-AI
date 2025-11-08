
# Eco-Learn-AI
EcoLearn + India is an AI-powered sustainability coach helping users learn, act, and live greener. Learn in Hindi or English, track impact, and earn EcoPoints for daily eco-actions.

# 🌍 EcoLearn+ India — Learn • Act • Earn

### *AI-powered Climate Learning and Green Lifestyle Platform using OpenAI GPT & Amazon Sustainability Data Initiative (ASDI)*

---

## 🧭 Overview

**EcoLearn+ India** is an AI-powered climate education and sustainability platform that helps people **learn, act, and live green**.

Built with **React (frontend)** and **FastAPI (backend)**, it combines:
- AI (OpenAI GPT) for bilingual education (English + Hindi)
- ASDI datasets for real climate data (temperature, CO₂, vegetation)
- Gamified eco-missions for behavior change
- A **Daily Green Routine Tracker** that analyzes users’ daily habits (like transport or food choices) and provides personalized eco-feedback.

> 🌱 “Learn about climate change, visualize its impact, take real actions, and earn rewards — all in one place.”

---

## 🎯 Problem Statement

Most people *want* to live sustainably, but they:
- Don’t fully understand their environmental impact.
- Lack access to localized, bilingual climate education.
- Struggle to turn awareness into measurable actions.

**EcoLearn+ India** bridges this gap by combining **AI learning**, **real data**, and **daily eco-feedback** into a single, interactive experience.

---

## 💡 Key Features

| Feature | Description |
|----------|--------------|
| 🧠 **AI Climate Tutor** | Ask any climate-related question and get simple explanations in English or Hindi. |
| 📊 **Real Data Visualization** | View ASDI datasets (India’s temperature and CO₂ trends) with interactive charts. |
| 💪 **Eco-Missions** | Daily micro-tasks that reduce CO₂ and award EcoPoints. |
| 🏅 **EcoPoints & Badges** | Gamified system for rewarding sustainable actions. |
| 🌿 **Daily Green Routine Tracker (NEW)** | Log daily activities, see their CO₂ footprint, and receive eco-friendly tips and benefits. |
| 🗣️ **Bilingual Interface** | English + Hindi language support for accessibility. |

---

## ⚙️ Tech Stack

| Layer | Technology | Purpose |
|-------|-------------|----------|
| **Frontend** | React.js, Chart.js, Axios | Web UI, charts, API integration |
| **Backend** | FastAPI (Python), Uvicorn | API logic, AI connection, data handling |
| **AI** | OpenAI GPT (gpt-3.5-turbo) | AI explanations, bilingual learning, green tips |
| **Data** | Amazon Sustainability Data Initiative (ASDI) | Climate & emission datasets |
| **Database** | JSON / SQLite | Local user data & EcoPoints storage |
| **Styling** | TailwindCSS | Clean, responsive design |
| **Deployment** | Vercel / Streamlit Cloud / AWS | Hosting platform |
| **Version Control** | Git + GitHub | Collaboration & management |

---

## 🧠 Architecture


React Frontend
↓
FastAPI Backend (Python)
↓
├── /explain → AI Tutor (GPT)
├── /data/india/temp → ASDI dataset visualization
├── /missions → Eco-missions list
├── /complete → Track EcoPoints
├── /analyze → Daily Routine Tracker (CO₂ & eco-tips)
└── /user/{id} → User profile data
