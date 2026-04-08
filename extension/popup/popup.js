// Circuit Breaker Extension — Thin Popup (opens web dashboard)

const DASHBOARD_URL = 'https://circuitbreaker.app/#dashboard';

const statusDot = document.getElementById('status-dot');
const statusText = document.getElementById('status-text');

// Load status from storage
chrome.storage.sync.get(['selections'], (data) => {
  const selections = data.selections || {};
  const tripped = Object.values(selections).filter(c => c.enabled).length;
  const total = categories.length;

  if (tripped === 0) {
    statusDot.className = 'status-dot';
    statusText.textContent = 'Nothing blocked yet';
  } else if (tripped === total) {
    statusDot.className = 'status-dot active';
    statusText.textContent = `All ${tripped} categories blocked`;
  } else {
    statusDot.className = 'status-dot partial';
    statusText.textContent = `${tripped} of ${total} blocked`;
  }
});

// Open dashboard
document.getElementById('open-dashboard').addEventListener('click', () => {
  chrome.tabs.create({ url: DASHBOARD_URL });
  window.close();
});
