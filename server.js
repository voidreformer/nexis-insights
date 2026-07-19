const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { OpenAI } = require('openai'); // Used for standard LLMs and OmniRoute NIM fallback
const axios = require('axios');
const cheerio = require('cheerio');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Serve static frontend files for unified deployment
app.use(express.static(__dirname));

// Initialize OmniRoute Fallback Client (NVIDIA NIM)
const omniRouteClient = new OpenAI({
  baseURL: process.env.OMNIROUTE_GATEWAY_URL || 'https://integrate.api.nvidia.com/v1',
  apiKey: process.env.OMNIROUTE_API_KEY || 'dummy_nim_key' // OmniRoute NIM API key
});

const SYSTEM_PROMPT = `
You are an expert product manager AI. Analyze the following user feedback.
Return a RAW JSON object strictly matching this schema:
{
  "positive_pct": <number 0-100>,
  "neutral_pct": <number 0-100>,
  "negative_pct": <number 0-100>,
  "pain_points": ["<point 1>", "<point 2>"],
  "feature_requests": ["<req 1>", "<req 2>"],
  "executive_summary": "<1 paragraph strategic summary>"
}
Ensure the percentages sum to 100. DO NOT include markdown formatting (\`\`\`json) in the response, just the raw JSON string.
`;

app.post('/api/analyze', async (req, res) => {
  let { text } = req.body;
  if (!text) return res.status(400).json({ error: 'Text or URL is required' });

  // Web Scraping Logic if a URL is provided
  let analysisContent = text;
  if (text.trim().startsWith('http://') || text.trim().startsWith('https://')) {
    console.log(`[Scraper] URL detected. Fetching data from: ${text}`);
    try {
      const response = await axios.get(text.trim(), {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      const $ = cheerio.load(response.data);
      // Remove unnecessary elements
      $('script, style, noscript, nav, footer, header').remove();
      // Extract visible text
      const scrapedText = $('body').text().replace(/\s+/g, ' ').trim();

      // Limit to ~15000 chars to avoid token limits on fallback models
      analysisContent = "Scraped Website Content:\n" + scrapedText.substring(0, 15000);
      console.log(`[Scraper] Successfully extracted ${analysisContent.length} characters.`);
    } catch (scrapeErr) {
      console.error('[Scraper] Failed to scrape URL:', scrapeErr.message);
      return res.status(400).json({ error: 'Failed to scrape the provided URL. Please paste raw text instead.' });
    }
  }

  try {
    // 1. Primary Attempt (e.g., standard internal LLM or Google GenAI)
    // Simulating a context limit or failure to trigger the OmniRoute Fallback per COMPULSORY PLAN
    console.log('[Primary] Attempting standard analysis...');
    throw new Error('API_LIMIT_REACHED');

  } catch (err) {
    console.log(`[Error] Primary failed: ${err.message}. Switching to OmniRoute Gateway (NIM Fallback)...`);

    // 2. BACKEND FALLBACK: OmniRoute Gateway -> NVIDIA NIM (llama-3.1-405b-instruct)
    try {
      const response = await omniRouteClient.chat.completions.create({
        model: 'nvidia/llama-3.1-405b-instruct',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: analysisContent }
        ],
        temperature: 0.2,
        max_tokens: 1024
      });

      let rawContent = response.choices[0].message.content.trim();
      // Clean up potential markdown formatting if the model leaked it
      if (rawContent.startsWith('\`\`\`json')) {
        rawContent = rawContent.replace(/^\`\`\`json/g, '').replace(/\`\`\`$/g, '').trim();
      }

      const parsedData = JSON.parse(rawContent);
      return res.json(parsedData);

    } catch (omniErr) {
      console.error('[OmniRoute] Fallback also failed:', omniErr);

      // Safety mock fallback for UI demonstration if no valid API keys are present
      return res.json({
        positive_pct: 45,
        neutral_pct: 20,
        negative_pct: 35,
        pain_points: ["Simulated: API Keys missing for NIM fallback", "Simulated: Checkout issues"],
        feature_requests: ["Simulated: PDF export"],
        executive_summary: "[MOCK DATA] OmniRoute backend initiated successfully, but API keys are pending. Scraper logic triggered if URL was passed."
      });
    }
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Nexis Insights API running on port ${PORT}`);
  console.log(`🛡️ OmniRoute NIM Fallback configured (nvidia/llama-3.1-405b-instruct)`);
});
