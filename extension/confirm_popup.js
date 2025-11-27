document.addEventListener('DOMContentLoaded', async () => {
  // Get URL parameters
  const params = new URLSearchParams(window.location.search);
  const downloadUrl = params.get('url');
  const referrer = params.get('referrer');
  const filename = params.get('filename');

  // Populate URL
  const urlElement = document.getElementById('download-url');
  if (downloadUrl) {
    urlElement.textContent = downloadUrl;
    urlElement.title = downloadUrl;
  } else {
    urlElement.textContent = 'Error: No URL provided';
  }

  // Fetch available backends from AriaLUI
  try {
    const response = await fetch('http://localhost:6801/get-backends');
    const data = await response.json();
    
    const select = document.getElementById('backend-select');
    const warning = document.getElementById('backend-warning');
    
    // Clear existing options
    select.innerHTML = '';
    
    // Add backend options
    data.backends.forEach(backend => {
      const option = document.createElement('option');
      option.value = backend.id;
      
      let label = backend.name;
      if (backend.id === data.defaultBackend) {
        label += ' (Default)';
      }
      if (!backend.enabled) {
        label += ' - Disabled';
        option.disabled = true;
      } else if (backend.health !== 'healthy') {
        label += ` - ${backend.health}`;
        option.disabled = true;
      }
      
      option.textContent = label;
      option.dataset.backendId = backend.id;
      select.appendChild(option);
    });
    
    // Pre-select default backend
    if (data.defaultBackend) {
      select.value = data.defaultBackend;
    }
    
    // Show warning for direct download
    const  updateWarning = () => {
      const selectedId = select.value;
      if (selectedId === 'direct') {
        warning.style.display = 'block';
      } else {
        warning.style.display = 'none';
      }
    };
    
    select.addEventListener('change', updateWarning);
    updateWarning();
    
  } catch (error) {
    console.error('Failed to fetch backends:', error);
    // Fallback to default options
    const select = document.getElementById('backend-select');
    select.innerHTML = '<option value="aria2">Aria2 (Default)</option>';
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

