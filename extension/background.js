// Default settings
const DEFAULT_SETTINGS = {
  autoIntercept: true,
  serverUrl: 'http://localhost:6801'
};

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
    }
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "download-with-arialui") {
    const url = info.linkUrl || info.srcUrl;
    if (url) {
      sendToAriaLUI(url, info.pageUrl, tab?.title);
    }
  }
});

// Intercept downloads automatically if enabled
chrome.downloads.onCreated.addListener(async (downloadItem) => {
  const { settings } = await chrome.storage.sync.get(['settings']);
  const autoIntercept = settings?.autoIntercept ?? DEFAULT_SETTINGS.autoIntercept;

  if (!autoIntercept) {
    return; // User disabled auto-intercept
  }

  // Don't intercept if it's a very small file (likely a webpage/html)
  // or if we don't have a URL
  if (!downloadItem.url || downloadItem.url.startsWith('data:')) {
    return;
  }

  try {
    // Cancel the browser download
    chrome.downloads.cancel(downloadItem.id, () => {
      chrome.downloads.erase({ id: downloadItem.id });
    });

    // Send to AriaLUI
    const success = await sendToAriaLUI(
      downloadItem.url,
      downloadItem.referrer,
      downloadItem.filename
    );

    if (success) {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icon.png',
        title: 'AriaLUI',
        message: 'Download sent to AriaLUI',
        priority: 1
      });
    }
  } catch (e) {
    console.error('Failed to intercept download:', e);
  }
});

// Send download to AriaLUI
async function sendToAriaLUI(url, referrer, filename) {
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

    const response = await fetch(`${serverUrl}/add-download`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        url, 
        referrer, 
        filename,
        cookies: cookieString,
        userAgent
      })
    });

    if (!response.ok) {
      throw new Error(`Server responded with ${response.status}`);
    }

    const data = await response.json();
    console.log('Sent to AriaLUI:', data);
    return true;
  } catch (e) {
    console.error('Failed to send to AriaLUI:', e);
    
    // Show error notification
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icon.png',
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
      method: 'GET'
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
});
