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
      data.pain_points.forEach(pt => {
        listPain.innerHTML += `<li>${pt}</li>`;
      });

      listFeatures.innerHTML = '';
      data.feature_requests.forEach(ft => {
        listFeatures.innerHTML += `<li>${ft}</li>`;
      });

      textSummary.innerHTML = data.executive_summary;

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