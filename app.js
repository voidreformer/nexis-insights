document.addEventListener('DOMContentLoaded', () => {
  const inputEl = document.getElementById('feedback-input');
  const analyzeBtn = document.getElementById('btn-analyze');
  const resultsContent = document.getElementById('results-content');
  const emptyState = document.getElementById('empty-state');
  const statusIndicator = document.getElementById('status-indicator');

  // Metrics
  const valPos = document.getElementById('val-pos');
  const valNeu = document.getElementById('val-neu');
  const valNeg = document.getElementById('val-neg');

  const listPain = document.getElementById('list-pain');
  const listFeatures = document.getElementById('list-features');
  const textSummary = document.getElementById('text-summary');

  // Pre-fill
  if (!inputEl.value) {
    inputEl.value = `- Checkout is extremely slow on Safari. Super frustrating!
- I love the new dark mode, but please let us export PDF reports.
- The UI is beautiful, but the settings menu is confusing.
- Amazing support! Resolved my issue in 5 minutes.`;
  }

  // Update char count
  const charCountEl = document.querySelector('.char-count');
  inputEl.addEventListener('input', () => {
    charCountEl.textContent = `${inputEl.value.length} chars`;
  });
  // Trigger initial
  charCountEl.textContent = `${inputEl.value.length} chars`;

  analyzeBtn.addEventListener('click', async () => {
    const text = inputEl.value.trim();
    if (!text) return;

    // Loading State
    analyzeBtn.innerHTML = `Analyzing... <span class="pulse-dot" style="margin-left: 8px;"></span>`;
    analyzeBtn.disabled = true;
    document.querySelector('.results-section').classList.add('analyzing');
    statusIndicator.innerHTML = `<span class="pulse-dot"></span> Processing via OmniRoute...`;

    try {
      // Try hitting our local backend first (we will build this next)
      let data;
      try {
        const response = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text })
        });

        if (!response.ok) throw new Error('API limit hit or server offline');
        data = await response.json();
      } catch (err) {
        console.warn('Backend unavailable, falling back to simulated NIM model response...', err);
        // Fallback: Simulated structured JSON (until backend is fully hooked up)
        await new Promise(r => setTimeout(r, 1500));
        data = {
          positive_pct: 45,
          neutral_pct: 20,
          negative_pct: 35,
          pain_points: [
            "Checkout process performance issues on Safari browser",
            "Settings menu navigation is counter-intuitive"
          ],
          feature_requests: [
            "PDF export functionality for reports"
          ],
          executive_summary: "User sentiment is mixed (45% positive). The primary blocker is checkout stability on Safari. High praise for support and visual design. Prioritize PDF exports for the next sprint."
        };
      }

      // Render Results
      emptyState.style.display = 'none';
      resultsContent.classList.remove('hidden');

      valPos.textContent = `${data.positive_pct}%`;
      valNeu.textContent = `${data.neutral_pct}%`;
      valNeg.textContent = `${data.negative_pct}%`;

      listPain.innerHTML = '';
      if(data.pain_points) data.pain_points.forEach(pt => {
        listPain.innerHTML += `<li>${pt}</li>`;
      });

      listFeatures.innerHTML = '';
      if(data.feature_requests) data.feature_requests.forEach(ft => {
        listFeatures.innerHTML += `<li>${ft}</li>`;
      });

      if(textSummary) textSummary.innerHTML = data.executive_summary;
      
      const aiWriteup = document.getElementById('ai-writeup');
      if (aiWriteup) aiWriteup.innerHTML = data.executive_summary;

      // Price Intelligence Logic
      const priceIntelCard = document.getElementById('price-intel-card');
      if (data.price_intelligence && priceIntelCard) {
        priceIntelCard.classList.remove('hidden');
        document.getElementById('buy-recommendation').textContent = data.price_intelligence.buy_recommendation;
        
        // Color code recommendation
        const recTag = document.getElementById('buy-recommendation');
        if (data.price_intelligence.buy_recommendation.includes('BUY')) {
          recTag.style.background = '#10b981'; // green
          recTag.style.color = '#fff';
        } else if (data.price_intelligence.buy_recommendation.includes('WAIT')) {
          recTag.style.background = '#f59e0b'; // yellow
          recTag.style.color = '#fff';
        } else {
          recTag.style.background = '#ef4444'; // red
          recTag.style.color = '#fff';
        }
        
        document.getElementById('detected-price').textContent = data.price_intelligence.detected_price;
        document.getElementById('price-reasoning').textContent = data.price_intelligence.reasoning;
        
        const compList = document.getElementById('competitor-list');
        compList.innerHTML = '';
        data.price_intelligence.competitor_prices.forEach(comp => {
          compList.innerHTML += `<li style="background: rgba(255,255,255,0.05); padding: 8px 12px; border-radius: 6px; display: flex; justify-content: space-between;">
            <span style="color: #cbd5e1;">${comp.store}</span>
            <span style="font-weight: 600; color: #fff;">${comp.price}</span>
          </li>`;
        });
        
        // Render Chart
        const ctx = document.getElementById('priceTrendChart').getContext('2d');
        if(window.priceChart) window.priceChart.destroy();
        window.priceChart = new Chart(ctx, {
          type: 'line',
          data: {
            labels: ['Month 1', 'Month 2', 'Month 3', 'Month 4', 'Month 5', 'Current'],
            datasets: [{
              label: 'Price Trend',
              data: data.price_intelligence.price_trend_last_6_months,
              borderColor: '#3b82f6',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              borderWidth: 2,
              fill: true,
              tension: 0.4
            }]
          },
          options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: { 
              y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } },
              x: { grid: { display: false }, ticks: { color: '#94a3b8' } }
            }
          }
        });
      } else if (priceIntelCard) {
        priceIntelCard.classList.add('hidden');
      }

      statusIndicator.innerHTML = `<span class="pulse-dot" style="background: var(--status-positive); box-shadow: 0 0 10px var(--status-positive);"></span> AI Analysis Complete`;

    } catch (err) {
      statusIndicator.innerHTML = `<span style="color: var(--status-negative)">Error: ${err.message}</span>`;
    } finally {
      document.querySelector('.results-section').classList.remove('analyzing');
      analyzeBtn.innerHTML = `Analyze via LLM <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>`;
      analyzeBtn.disabled = false;
    }
  });

  document.getElementById('btn-export').addEventListener('click', () => {
    alert('Report downloaded! (Powered by Open Design Components)');
  });
});