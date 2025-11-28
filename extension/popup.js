// Popup script for AriaLUI browser extension

let isConnected = false;

// Check connection status on load
document.addEventListener('DOMContentLoaded', async () => {
  await updateConnectionStatus();
  await loadSettings();
  setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
  const autoInterceptToggle = document.getElementById('autoIntercept');
  const autoStartToggle = document.getElementById('autoStart');
  const refreshButton = document.getElementById('refreshStatus');

  autoInterceptToggle?.addEventListener('change', async (e) => {
    const { settings } = await chrome.storage.sync.get(['settings']);
    const newSettings = {
      ...settings,
      autoIntercept: e.target.checked
    };
    await chrome.storage.sync.set({ settings: newSettings });
    showMessage('Settings saved!', 'success');
  });

  autoStartToggle?.addEventListener('change', async (e) => {
    const { settings } = await chrome.storage.sync.get(['settings']);
    const newSettings = {
      ...settings,
      autoStart: e.target.checked
    };
    await chrome.storage.sync.set({ settings: newSettings });
    showMessage('Settings saved!', 'success');
  });

  refreshButton?.addEventListener('click', async () => {
    await updateConnectionStatus();
  });
}

// Load settings from storage
async function loadSettings() {
  const { settings } = await chrome.storage.sync.get(['settings']);
  const autoInterceptToggle = document.getElementById('autoIntercept');
  const autoStartToggle = document.getElementById('autoStart');
  
  if (autoInterceptToggle) {
    autoInterceptToggle.checked = settings?.autoIntercept ?? true;
  }
  
  if (autoStartToggle) {
    autoStartToggle.checked = settings?.autoStart ?? false;
  }
}

// Update connection status
async function updateConnectionStatus() {
  const statusDot = document.getElementById('statusDot');
  const statusText = document.getElementById('statusText');
  const warningBox = document.getElementById('disconnectWarning');

  try {
    isConnected = await chrome.runtime.sendMessage({ action: 'checkConnection' });
    
    if (isConnected) {
      statusDot.className = 'status-dot connected';
      statusText.textContent = 'Connected';
      if (warningBox) warningBox.style.display = 'none';
    } else {
      statusDot.className = 'status-dot disconnected';
      statusText.textContent = 'Disconnected';
      if (warningBox) warningBox.style.display = 'flex';
    }
  } catch (e) {
    statusDot.className = 'status-dot disconnected';
    statusText.textContent = 'Error';
    if (warningBox) warningBox.style.display = 'flex';
  }
}

// Show temporary message
function showMessage(text, type = 'info') {
  const messageEl = document.getElementById('message');
  messageEl.textContent = text;
  messageEl.className = `message ${type}`;
  messageEl.style.display = 'block';

  setTimeout(() => {
    messageEl.style.display = 'none';
  }, 3000);
}
