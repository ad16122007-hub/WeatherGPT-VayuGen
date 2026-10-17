# 🌾 WeatherGPT — AI-Powered Multilingual Agro-Meteorology Assistant

> **Problem Statement ID:** CDC2603 · **Event:** CDC 2026  
> **Team:** Team VayuGen (Sneha Jayswal · Rishabh Mishra · Kalyani Kherwa · Adarsh Singh)  
> **Live Prototype:** [prototype-4db272.netlify.app](https://prototype-4db272.netlify.app/)

---

## 📌 Overview (संक्षिप्त परिचय)

Over 40% of India's workforce depends on agriculture, yet official forecasts often arrive as complex charts, millibars, and wind knots in English. **WeatherGPT** bridges the last-mile gap by turning official meteorology data (India Meteorological Department - IMD & Open-Meteo) into crystal-clear spoken and written words in Hindi, Bhojpuri, Punjabi, Marathi, Gujarati, Bengali, Telugu, Tamil, Kannada, and English.

Farmers can simply **tap a button and speak** in their regional language to receive direct, authoritative verdicts on:
- **Spraying safety (छिड़काव समय):** Wind drift risk, wash-off, and leaf wetness.
- **Smart irrigation (सिंचाई सलाह):** Soil moisture deficit vs. evapotranspiration ($ET_0$).
- **Extreme hazards (मौसम आपदाएं):** Heavy rain, frost (पाला), heatwave (लू), and hailstorms.

---

## ✨ Key Features

1. **Strict Same-Language Voice & Text Mirroring**:
   - Responds strictly in the dialect and script spoken by the farmer.
   - Zero-latency voice output using device Speech Synthesis and high-fidelity Gemini TTS.

2. **Ultra-Fast Real-Time Streaming (`/api/chat-stream`)**:
   - Server-Sent Events (SSE) streaming delivers first tokens in under 250ms.
   - Low reasoning latency via Gemini `ThinkingLevel.LOW`.

3. **Farmer-First Visual Dashboard**:
   - Live farm status badges: Temperature (°C), Rain Probability (%), Wind Speed (km/h), and Soil Moisture.
   - 1-Click quick question pills for immediate answers.

4. **Alerts & Disaster Early Warning**:
   - Village-specific subscription modal for heavy rainfall, storms, and frost advisories.

5. **Guardrails & Provenance**:
   - Official data sources only (IMD / Gramin Krishi Mausam Sewa & Open-Meteo).
   - Source cited on every advisory with no speculative guessing.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite, TypeScript, Tailwind CSS, Lucide Icons
- **Backend**: Node.js, Express (mounted as Vite dev middleware and production server)
- **AI Intelligence**: `@google/genai` TypeScript SDK (`gemini-3.8-flash` with streaming & low-latency thinking)
- **Audio Engine**: Web Speech Recognition API + Web Speech Synthesis API + Gemini Flash Lite TTS fallback
- **Weather Services**: Open-Meteo High-Resolution Agro-Meteorology API (IMD & ECMWF data)

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (v18 or higher)
- npm or pnpm

### 2. Installation
```bash
git clone <your-github-repo-url>
cd <repo-folder>
npm install
```

### 3. Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Add your Gemini API Key in `.env`:
```env
GEMINI_API_KEY="YOUR_GEMINI_API_KEY_HERE"
PORT=3000
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Build for Production
```bash
npm run build
npm start
```

---

## 👥 Team VayuGen
- **Sneha Jayswal**
- **Rishabh Mishra**
- **Kalyani Kherwa**
- **Adarsh Singh** (adarshsingh31354@gmail.com)

*Built with passion for India's farmers · Gramin Krishi Mausam Sewa*
