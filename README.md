# Nexis Insights

Nexis Insights is an AI-powered Product Feedback Analyzer. It ingests raw user feedback and automatically extracts actionable insights—including sentiment distribution, key pain points, feature requests, and an executive summary.

The backend uses a resilient AI architecture: it attempts standard analysis first, then gracefully falls back to an OmniRoute Gateway (NVIDIA NIM via `llama-3.1-405b-instruct`) ensuring maximum uptime.

## 🚀 Features

- **Automated Sentiment Analysis**: Understand the exact percentage of positive, neutral, and negative feedback.
- **Actionable Takeaways**: Instantly view the top pain points and most requested features.
- **Executive Summaries**: Get a high-level strategic overview of the feedback batch.
- **OmniRoute Fallback System**: Built-in redundancy if the primary LLM reaches limits or fails.
- **Modern UI**: A premium, glassmorphic design that visualizes the data beautifully.

## 🛠️ Tech Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Node.js, Express.js
- **AI Integration**: OpenAI SDK (compatible with NVIDIA NIM API for OmniRoute)
- **Deployment Ready**: Includes Dockerfile and render.yaml

## 📦 Local Setup

1. **Clone the repository**:
   ```bash
   git clone <your-repo-url>
   cd nexis-insights
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Environment Variables**:
   Create a `.env` file in the root directory and add your API keys:
   ```env
   PORT=3000
   OMNIROUTE_API_KEY=your_nim_api_key_here
   OMNIROUTE_GATEWAY_URL=https://integrate.api.nvidia.com/v1
   ```

4. **Run the Application**:
   ```bash
   npm start
   ```

5. **View in Browser**:
   Open [http://localhost:3000](http://localhost:3000)

## 🚢 Deployment (GitHub & Render)

This repository is ready to be deployed to platforms like [Render](https://render.com) or Heroku.

**To deploy to Render:**
1. Push this repository to your GitHub account.
2. Connect the repository to your Render account.
3. The included `render.yaml` Blueprint will automatically configure the Web Service.
4. Make sure to add `OMNIROUTE_API_KEY` to your environment variables in the Render dashboard.

## 🐋 Docker Support

A `Dockerfile` and `docker-compose.yml` are included for containerized deployments.

```bash
docker-compose up --build
```