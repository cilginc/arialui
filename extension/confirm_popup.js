document.addEventListener('DOMContentLoaded', () => {
  // Get URL parameters
  const params = new URLSearchParams(window.location.search);
  const downloadUrl = params.get('url');
  const referrer = params.get('referrer');
  const filename = params.get('filename');

  // Populate UI
  const urlElement = document.getElementById('download-url');
  if (downloadUrl) {
    urlElement.textContent = downloadUrl;
    urlElement.title = downloadUrl;
  } else {
    urlElement.textContent = 'Error: No URL provided';
  }

  // Handle Install
  document.getElementById('btn-install').addEventListener('click', async () => {
    if (!downloadUrl) return;

    const backend = document.getElementById('backend-select').value;

    // Send message to background script
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'confirmDownload',
        data: {
          url: downloadUrl,
          referrer: referrer,
          filename: filename,
          backend: backend
        }
      });

      if (response && response.success) {
        window.close();
      } else {
        alert('Failed to start download. Check if AriaLUI is running.');
      }
    } catch (e) {
      console.error('Error sending message:', e);
      alert('Error communicating with extension background script.');
    }
  });

  // Handle Cancel
  document.getElementById('btn-cancel').addEventListener('click', () => {
    window.close();
  });
});
