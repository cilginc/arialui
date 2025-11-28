// Default settings
const DEFAULT_SETTINGS = {
  autoIntercept: true,
  serverUrl: 'http://localhost:6801',
  autoStart: false
};

// Cache settings for synchronous access
let currentSettings = { ...DEFAULT_SETTINGS };

// Connection status cache
let isConnected = false;
let lastConnectionCheck = 0;
const CONNECTION_CHECK_INTERVAL = 5000; // Check every 5 seconds

// Initialize extension
chrome.runtime.onInstalled.addListener(() => {
  // Create context menu
  chrome.contextMenus.create({
    id: "download-with-arialui",
    title: "Download with AriaLUI",
    contexts: ["link", "image", "video", "audio"]
  });

  // Initialize settings
  chrome.storage.sync.get(['settings'], (result) => {
    if (!result.settings) {
      chrome.storage.sync.set({ settings: DEFAULT_SETTINGS });
    } else {
      currentSettings = { ...DEFAULT_SETTINGS, ...result.settings };
      // Ensure new settings are added to existing ones
      const newSettings = { ...DEFAULT_SETTINGS, ...result.settings };
      if (JSON.stringify(newSettings) !== JSON.stringify(result.settings)) {
        chrome.storage.sync.set({ settings: newSettings });
      }
    }
  });

  // Start periodic connection check
  startConnectionMonitoring();
});

// Keep settings cache updated
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync' && changes.settings) {
    currentSettings = { ...DEFAULT_SETTINGS, ...changes.settings.newValue };
  }
});

// Load settings on startup
chrome.storage.sync.get(['settings'], (result) => {
  if (result.settings) {
    currentSettings = { ...DEFAULT_SETTINGS, ...result.settings };
  }
});

// Start connection monitoring on startup as well
startConnectionMonitoring();

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "download-with-arialui") {
    const url = info.linkUrl || info.srcUrl;
    if (url) {
      handleDownloadRequest(url, info.pageUrl, tab?.title);
    }
  }
});

// Connection monitoring function
function startConnectionMonitoring() {
  // Perform initial check
  updateConnectionStatus();

  // Set up periodic checks
  setInterval(updateConnectionStatus, CONNECTION_CHECK_INTERVAL);
}

async function updateConnectionStatus() {
  const now = Date.now();
  
  // Skip if we checked recently (within 1 second to avoid rapid checks)
  if (now - lastConnectionCheck < 1000) {
    return;
  }
  
  lastConnectionCheck = now;
  const connected = await checkConnection();
  
  if (isConnected !== connected) {
    isConnected = connected;
    console.log(`[EXTENSION] AriaLUI connection status changed: ${connected ? 'Connected' : 'Disconnected'}`);
  }
}

// Intercept downloads automatically if enabled
// Using onDeterminingFilename to prevent "Save As" dialog from appearing
chrome.downloads.onDeterminingFilename.addListener((downloadItem, suggest) => {
  const autoIntercept = currentSettings.autoIntercept;

  if (!autoIntercept) {
    console.log('[EXTENSION] Auto-intercept disabled, letting browser handle download');
    return false; // Let browser handle it
  }

  // Check if AriaLUI is connected - if not, let browser handle download
  if (!isConnected) {
    console.log('[EXTENSION] AriaLUI not connected, letting browser handle download');
    return false; // Let browser handle it
  }

  // Don't intercept if it's a very small file (likely a webpage/html)
  // or if we don't have a URL
  if (!downloadItem.url || downloadItem.url.startsWith('data:')) {
    return false;
  }

  // Check if this download was initiated by our extension to avoid loops
  // (Though we use fetch for AriaLUI, so it shouldn't trigger this, but good to be safe)
  
  try {
    console.log('[EXTENSION] Intercepting download:', downloadItem.url);

    // Cancel the browser download immediately
    chrome.downloads.cancel(downloadItem.id, () => {
      if (chrome.runtime.lastError) {
        console.warn('Failed to cancel download:', chrome.runtime.lastError);
      }
      chrome.downloads.erase({ id: downloadItem.id });
    });

    handleDownloadRequest(
      downloadItem.url,
      downloadItem.referrer,
      downloadItem.filename
    );

    // Return true to tell Chrome we are handling the filename determination.
    // Since we cancelled the download, we don't need to call suggest().
    // This effectively pauses the native download flow until cancellation takes effect.
    return true;

  } catch (e) {
    console.error('Failed to intercept download:', e);
    return false;
  }
});

async function handleDownloadRequest(url, referrer, filename) {
  const autoStart = currentSettings.autoStart;

  if (!autoStart) {
    // Open confirmation popup
    const popupUrl = `confirm_popup.html?url=${encodeURIComponent(url)}&referrer=${encodeURIComponent(referrer || '')}&filename=${encodeURIComponent(filename || '')}`;
    
    // Get current window to center the popup
    chrome.windows.getCurrent((currentWindow) => {
      const width = 500;
      const height = 500;
      let left = 100;
      let top = 100;

      if (currentWindow) {
        left = Math.round(currentWindow.left + (currentWindow.width - width) / 2);
        top = Math.round(currentWindow.top + (currentWindow.height - height) / 2);
      }

      chrome.windows.create({
        url: popupUrl,
        type: 'popup',
        width: width,
        height: height,
        left: left,
        top: top
      });
    });
  } else {
    // Send directly to AriaLUI
    const success = await sendToAriaLUI(url, referrer, filename);
    if (success) {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon-48.png',
        title: 'AriaLUI',
        message: 'Download sent to AriaLUI',
        priority: 1
      });
    }
  }
}

// Send download to AriaLUI
async function sendToAriaLUI(url, referrer, filename, backend = 'aria2') {
  console.log('[EXTENSION] sendToAriaLUI called with URL:', url);
  try {
    const { settings } = await chrome.storage.sync.get(['settings']);
    const serverUrl = settings?.serverUrl ?? DEFAULT_SETTINGS.serverUrl;

    // Get cookies
    let cookieString = '';
    try {
      const cookies = await chrome.cookies.getAll({ url: url });
      if (cookies) {
        cookieString = cookies.map(c => `${c.name}=${c.value}`).join('; ');
      }
    } catch (e) {
      console.warn('Failed to get cookies:', e);
    }

    // Get User Agent
    const userAgent = navigator.userAgent;

    console.log('[EXTENSION] Sending POST request to:', `${serverUrl}/add-download`);
    const response = await fetch(`${serverUrl}/add-download`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        url, 
        referrer, 
        filename,
        cookies: cookieString,
        userAgent,
        backend // Send selected backend
      })
    });

    if (!response.ok) {
      throw new Error(`Server responded with ${response.status}`);
    }

    const data = await response.json();
    console.log('[EXTENSION] Sent to AriaLUI successfully:', data);
    
    // Update connection status since we successfully connected
    isConnected = true;
    lastConnectionCheck = Date.now();
    
    return true;
  } catch (e) {
    console.error('Failed to send to AriaLUI:', e);
    
    // Update connection status since we failed to connect
    isConnected = false;
    lastConnectionCheck = Date.now();
    
    // Show error notification
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon-48.png',
      title: 'AriaLUI Connection Error',
      message: 'Could not connect to AriaLUI. Make sure the application is running.',
      priority: 2
    });
    
    return false;
  }
}

// Check if AriaLUI is running
async function checkConnection() {
  try {
    const { settings } = await chrome.storage.sync.get(['settings']);
    const serverUrl = settings?.serverUrl ?? DEFAULT_SETTINGS.serverUrl;

    const response = await fetch(`${serverUrl}/ping`, {
      method: 'GET',
      signal: AbortSignal.timeout(2000) // 2 second timeout
    });

    return response.ok;
  } catch (e) {
    return false;
  }
}

// Handle messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'checkConnection') {
    checkConnection().then(sendResponse);
    return true; // Will respond asynchronously
  }
  
  if (request.action === 'confirmDownload') {
    const { url, referrer, filename, backend } = request.data;
    sendToAriaLUI(url, referrer, filename, backend).then(success => {
      sendResponse({ success });
    });
    return true; // Will respond asynchronously
  }
  
  if (request.action === 'getConnectionStatus') {
    sendResponse({ isConnected });
    return false;
  }
});
