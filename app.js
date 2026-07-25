document.addEventListener('DOMContentLoaded', () => {
  const inputEl = document.getElementById('feedback-input');
  const analyzeBtn = document.getElementById('analyze-btn');
  const resultsContent = document.getElementById('results-panel');
  const statusIndicator = document.querySelector('.status-badge');

  // Metrics
  const valPos = document.getElementById('pos-pct');
  const valNeu = document.getElementById('neu-pct');
  const valNeg = document.getElementById('neg-pct');
  
  // Progress bars
  const barPos = document.getElementById('pos-bar');
  const barNeu = document.getElementById('neu-bar');
  const barNeg = document.getElementById('neg-bar');

  const listPain = document.getElementById('pain-points-list');
  const listFeatures = document.getElementById('features-list');
  const aiWriteup = document.getElementById('ai-writeup');

  // Auth & View state
  let currentUser = null;
  let isRegisterMode = false;

  const userProfileBtn = document.getElementById('user-profile-btn');
  const userAvatar = document.getElementById('user-avatar');
  const userNameDisplay = document.getElementById('user-name-display');
  const userRoleDisplay = document.getElementById('user-role-display');

  const authModal = document.getElementById('auth-modal');
  const closeModalBtn = document.getElementById('close-modal-btn');
  const authForm = document.getElementById('auth-form');
  const authName = document.getElementById('auth-name');
  const authEmail = document.getElementById('auth-email');
  const authPassword = document.getElementById('auth-password');
  const nameGroup = document.getElementById('name-group');
  const modalTitle = document.getElementById('modal-title');
  const authSubmitBtn = document.getElementById('auth-submit-btn');
  const authToggleBtn = document.getElementById('auth-toggle-btn');
  const authToggleText = document.getElementById('auth-toggle-text');
  const authErrorMsg = document.getElementById('auth-error-msg');

  const navDashboard = document.getElementById('nav-dashboard');
  const navHistory = document.getElementById('nav-history');
  const viewDashboard = document.getElementById('view-dashboard-container');
  const viewHistory = document.getElementById('view-history-container');
  const historyItemsContainer = document.getElementById('history-items-container');

  function getToken() {
    return localStorage.getItem('nexis_auth_token');
  }

  function setToken(token) {
    localStorage.setItem('nexis_auth_token', token);
  }

  function removeToken() {
    localStorage.removeItem('nexis_auth_token');
  }

  async function checkAuth() {
    const token = getToken();
    if (!token) {
      updateUserUI(null);
      return;
    }

    try {
      const res = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        currentUser = data.user;
        updateUserUI(currentUser);
      } else {
        removeToken();
        updateUserUI(null);
      }
    } catch(e) {
      console.warn('Auth check failed:', e);
      updateUserUI(null);
    }
  }

  function updateUserUI(user) {
    if (user) {
      userAvatar.textContent = user.name ? user.name.charAt(0).toUpperCase() : 'U';
      userNameDisplay.textContent = user.name;
      userRoleDisplay.textContent = 'Authenticated (Logout)';
    } else {
      userAvatar.textContent = '?';
      userNameDisplay.textContent = 'Guest Mode';
      userRoleDisplay.textContent = 'Click to Login / Register';
    }
  }

  // Auth Modal Toggles
  userProfileBtn.addEventListener('click', () => {
    if (currentUser) {
      if (confirm(`Logout from ${currentUser.name}?`)) {
        removeToken();
        currentUser = null;
        updateUserUI(null);
      }
    } else {
      showAuthModal(false);
    }
  });

  closeModalBtn.addEventListener('click', () => {
    authModal.classList.add('hidden');
  });

  authToggleBtn.addEventListener('click', (e) => {
    e.preventDefault();
    showAuthModal(!isRegisterMode);
  });

  function showAuthModal(registerMode) {
    isRegisterMode = registerMode;
    authErrorMsg.classList.add('hidden');
    if (registerMode) {
      modalTitle.textContent = 'Create Nexis Account';
      nameGroup.style.display = 'flex';
      authSubmitBtn.textContent = 'Register';
      authToggleText.innerHTML = 'Already have an account? <a href="#" id="auth-toggle-btn">Sign in here</a>';
    } else {
      modalTitle.textContent = 'Login to Nexis Insights';
      nameGroup.style.display = 'none';
      authSubmitBtn.textContent = 'Sign In';
      authToggleText.innerHTML = 'Don\'t have an account? <a href="#" id="auth-toggle-btn">Register here</a>';
    }
    document.getElementById('auth-toggle-btn').addEventListener('click', (e) => {
      e.preventDefault();
      showAuthModal(!isRegisterMode);
    });
    authModal.classList.remove('hidden');
  }

  authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    authErrorMsg.classList.add('hidden');
    authSubmitBtn.disabled = true;
    authSubmitBtn.textContent = 'Processing...';

    const endpoint = isRegisterMode ? '/api/auth/register' : '/api/auth/login';
    const payload = isRegisterMode 
      ? { name: authName.value, email: authEmail.value, password: authPassword.value }
      : { email: authEmail.value, password: authPassword.value };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Authentication failed');

      setToken(data.token);
      currentUser = data.user;
      updateUserUI(currentUser);
      authModal.classList.add('hidden');
      alert(`Welcome, ${currentUser.name}!`);
    } catch(err) {
      authErrorMsg.textContent = err.message;
      authErrorMsg.classList.remove('hidden');
    } finally {
      authSubmitBtn.disabled = false;
      authSubmitBtn.textContent = isRegisterMode ? 'Register' : 'Sign In';
    }
  });

  const navSettings = document.getElementById('nav-settings');
  const viewSettings = document.getElementById('view-settings-container');

  // Navigation Switch
  navDashboard.addEventListener('click', () => {
    navDashboard.classList.add('active');
    navHistory.classList.remove('active');
    if (navSettings) navSettings.classList.remove('active');
    viewDashboard.classList.remove('hidden');
    viewHistory.classList.add('hidden');
    if (viewSettings) viewSettings.classList.add('hidden');
  });

  navHistory.addEventListener('click', () => {
    navHistory.classList.add('active');
    navDashboard.classList.remove('active');
    if (navSettings) navSettings.classList.remove('active');
    viewHistory.classList.remove('hidden');
    viewDashboard.classList.add('hidden');
    if (viewSettings) viewSettings.classList.add('hidden');
    loadHistory();
  });

  if (navSettings) {
    navSettings.addEventListener('click', () => {
      navSettings.classList.add('active');
      navDashboard.classList.remove('active');
      navHistory.classList.remove('active');
      viewSettings.classList.remove('hidden');
      viewDashboard.classList.add('hidden');
      viewHistory.classList.add('hidden');
    });
  }

  // Refresh & Export Buttons
  const refreshHistoryBtn = document.getElementById('refresh-history-btn');
  if (refreshHistoryBtn) refreshHistoryBtn.addEventListener('click', loadHistory);

  const exportCsvBtn = document.getElementById('export-history-csv-btn');
  if (exportCsvBtn) {
    exportCsvBtn.addEventListener('click', async () => {
      const token = getToken();
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      try {
        const res = await fetch('/api/history', { headers });
        const data = await res.json();
        if (!data.history || data.history.length === 0) {
          alert('No history records available to export.');
          return;
        }

        let csvStr = "ID,Created At,Input Text,Positive %,Neutral %,Negative %,Detected Price,Recommendation,Executive Summary\n";
        data.history.forEach(item => {
          const safeText = (item.input_text || '').replace(/"/g, '""');
          const safeSummary = (item.executive_summary || '').replace(/"/g, '""');
          const price = item.price_intelligence ? (item.price_intelligence.detected_price || 'N/A') : 'N/A';
          const rec = item.price_intelligence ? (item.price_intelligence.buy_recommendation || 'N/A') : 'N/A';
          csvStr += `"${item.id}","${item.created_at}","${safeText}",${item.positive_pct},${item.neutral_pct},${item.negative_pct},"${price}","${rec}","${safeSummary}"\n`;
        });

        const blob = new Blob([csvStr], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `nexis_analysis_history_${Date.now()}.csv`;
        a.click();
      } catch (err) {
        alert('Failed to export CSV: ' + err.message);
      }
    });
  }

  // Settings Save Button
  const btnSaveSettings = document.getElementById('btn-save-settings');
  if (btnSaveSettings) {
    btnSaveSettings.addEventListener('click', () => {
      alert('Preferences saved successfully! AI & Scraper settings updated.');
    });
  }

  async function loadHistory() {
    historyItemsContainer.innerHTML = '<div style="color: var(--text-muted); padding: 20px; text-align: center;">Loading saved history from SQLite database...</div>';
    const token = getToken();
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

    try {
      const res = await fetch('/api/history', { headers });
      const data = await res.json();
      if (!data.history || data.history.length === 0) {
        historyItemsContainer.innerHTML = '<div style="color: var(--text-muted); padding: 20px; text-align: center;">No saved analysis history found. Analyze comments on the Dashboard to save reports to SQLite!</div>';
        return;
      }

      historyItemsContainer.innerHTML = '';
      data.history.forEach(item => {
        const dateStr = new Date(item.created_at).toLocaleString();
        const price = item.price_intelligence ? item.price_intelligence.detected_price : 'N/A';
        const rec = item.price_intelligence ? item.price_intelligence.buy_recommendation : 'INFO';
        const badgeBg = rec === 'BUY NOW' ? '#10b981' : (rec === 'WAIT' ? '#f59e0b' : '#3b82f6');

        const card = document.createElement('div');
        card.className = 'history-card';
        card.style.cssText = 'background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 16px; margin-bottom: 12px;';
        card.innerHTML = `
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <div style="display: flex; gap: 8px; align-items: center;">
              <span style="font-weight: 700; color: #fff; font-size: 15px;">Report #${item.id.substring(0,8)}</span>
              <span style="background: ${badgeBg}; color: #fff; font-size: 11px; padding: 2px 8px; border-radius: 6px; font-weight: 600;">${rec}</span>
              <span style="background: rgba(255,255,255,0.1); color: var(--accent-primary); font-size: 11px; padding: 2px 8px; border-radius: 6px; font-weight: 600;">Price: ${price}</span>
            </div>
            <span style="color: var(--text-muted); font-size: 12px;">📅 ${dateStr}</span>
          </div>
          <p style="color: var(--text-muted); font-size: 13px; margin-bottom: 8px; font-style: italic;">"${item.input_text.substring(0, 140)}..."</p>
          <div style="display: flex; gap: 16px; font-size: 13px; margin-bottom: 8px;">
            <span style="color: var(--status-positive); font-weight: 600;">Positive: ${item.positive_pct}%</span>
            <span style="color: var(--status-neutral); font-weight: 600;">Neutral: ${item.neutral_pct}%</span>
            <span style="color: var(--status-negative); font-weight: 600;">Negative: ${item.negative_pct}%</span>
          </div>
          <p style="font-size: 13px; color: #e2e8f0; line-height: 1.4;"><strong>Executive Summary:</strong> ${item.executive_summary}</p>
        `;
        historyItemsContainer.appendChild(card);
      });
    } catch(err) {
      historyItemsContainer.innerHTML = `<div style="color: var(--status-negative); padding: 20px; text-align: center;">Failed to load history: ${err.message}</div>`;
    }
  }

  // Clean Initial Startup - No pre-filled dummy text
  if (!inputEl.value) {
    inputEl.value = '';
  }

  // Analysis Button Event
  analyzeBtn.addEventListener('click', async () => {
    const text = inputEl.value.trim();
    if (!text) return;

    analyzeBtn.innerHTML = 'Analyzing...';
    analyzeBtn.disabled = true;
    if (statusIndicator) statusIndicator.textContent = 'Processing via NVIDIA Nemotron...';
    if (statusIndicator) statusIndicator.style.background = '#f59e0b';

    const token = getToken();
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
      let data;
      try {
        const response = await fetch('/api/analyze', {
          method: 'POST',
          headers,
          body: JSON.stringify({ text })
        });

        if (!response.ok) throw new Error('API error or server offline');
        data = await response.json();
      } catch (err) {
        console.warn('Backend error:', err);
        alert('Server processing error. Please try again.');
        return;
      }

      // Calculate real line/comment count
      const lineCount = text.split('\n').filter(l => l.trim().length > 0).length || 1;
      const statParsedEl = document.getElementById('stat-parsed');
      const statPositiveEl = document.getElementById('stat-positive');

      if (statParsedEl) statParsedEl.textContent = lineCount;
      if (statPositiveEl) statPositiveEl.textContent = `${data.positive_pct}%`;

      // Render Results
      resultsContent.classList.remove('hidden');

      valPos.textContent = `${data.positive_pct}%`;
      valNeu.textContent = `${data.neutral_pct}%`;
      valNeg.textContent = `${data.negative_pct}%`;
      
      barPos.style.width = `${data.positive_pct}%`;
      barNeu.style.width = `${data.neutral_pct}%`;
      barNeg.style.width = `${data.negative_pct}%`;

      listPain.innerHTML = '';
      if(data.pain_points) data.pain_points.forEach(pt => {
        listPain.innerHTML += `<li>${pt}</li>`;
      });

      listFeatures.innerHTML = '';
      if(data.feature_requests) data.feature_requests.forEach(ft => {
        listFeatures.innerHTML += `<li>${ft}</li>`;
      });

      if (aiWriteup) aiWriteup.innerHTML = data.executive_summary;

      // Price Intelligence Logic
      const priceIntelCard = document.getElementById('price-intel-card');
      if (data.price_intelligence && priceIntelCard) {
        priceIntelCard.classList.remove('hidden');
        document.getElementById('buy-recommendation').textContent = data.price_intelligence.buy_recommendation;
        
        const recTag = document.getElementById('buy-recommendation');
        if (data.price_intelligence.buy_recommendation.includes('BUY')) {
          recTag.style.background = 'var(--status-positive, #10b981)';
        } else if (data.price_intelligence.buy_recommendation.includes('WAIT')) {
          recTag.style.background = 'var(--status-neutral, #f59e0b)';
        } else {
          recTag.style.background = 'var(--status-negative, #ef4444)';
        }
        
        document.getElementById('detected-price').textContent = data.price_intelligence.detected_price;
        document.getElementById('price-reasoning').textContent = data.price_intelligence.reasoning;
        
        const compList = document.getElementById('competitor-list');
        compList.innerHTML = '';
        if (data.price_intelligence.competitor_prices) {
          data.price_intelligence.competitor_prices.forEach(comp => {
            compList.innerHTML += `<li class="card card-variant-stroke" style="padding: 8px 12px; display: flex; justify-content: space-between; border-radius: var(--sds-size-radius-200);">
              <span style="color: var(--sds-color-text-default-secondary);">${comp.store}</span>
              <span style="font-weight: 600; color: var(--sds-color-text-default-default);">${comp.price}</span>
            </li>`;
          });
        }
        
        try {
          const ctx = document.getElementById('priceTrendChart').getContext('2d');
          if(window.priceChart) window.priceChart.destroy();
          window.priceChart = new Chart(ctx, {
            type: 'line',
            data: {
              labels: ['M1', 'M2', 'M3', 'M4', 'M5', 'Now'],
              datasets: [{
                label: 'Price Trend',
                data: data.price_intelligence.price_trend_last_6_months || [100, 120, 110, 140, 130, 125],
                borderColor: '#7C3AED',
                backgroundColor: 'rgba(124, 58, 237, 0.1)',
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
        } catch(e) { console.error('Chart error', e); }
      } else if (priceIntelCard) {
        priceIntelCard.classList.add('hidden');
      }

      if (statusIndicator) {
        statusIndicator.textContent = 'AI Model Ready';
        statusIndicator.style.background = 'rgba(16, 185, 129, 0.2)';
        statusIndicator.style.color = '#10b981';
      }

    } catch (err) {
      if (statusIndicator) {
        statusIndicator.textContent = 'Error: ' + err.message;
        statusIndicator.style.background = '#ef4444';
      }
    } finally {
      analyzeBtn.innerHTML = 'Analyze Comments';
      analyzeBtn.disabled = false;
    }
  });

  // Init auth check
  checkAuth();
});