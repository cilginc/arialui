# AriaLUI Browser Extension

Browser extension to integrate downloads with the AriaLUI desktop application.

## Features

- **Auto-intercept downloads**: Automatically send downloads to AriaLUI when enabled
- **Connection-aware**: Only intercepts downloads when AriaLUI is connected
- **Fallback to browser**: If AriaLUI is not running, downloads are handled by your browser normally
- **Confirmation popup**: Optional popup to confirm downloads before sending to AriaLUI
- **Context menu**: Right-click any link and select "Download with AriaLUI"

## How It Works

The extension monitors the connection status to AriaLUI every 5 seconds. When a download is initiated:

1. If **Auto-intercept** is enabled AND AriaLUI is **connected**: The download is sent to AriaLUI
2. If **Auto-intercept** is enabled BUT AriaLUI is **disconnected**: The browser handles the download normally
3. If **Auto-intercept** is disabled: The browser handles the download normally

This ensures that users can always download files, even if AriaLUI is not running.

## Settings

- **Auto-intercept downloads**: When enabled, all downloads are automatically sent to AriaLUI (if connected)
- **Auto-start downloads**: When enabled, downloads start immediately without showing a confirmation popup

## Connection Status

The extension popup shows the current connection status:

- 🟢 **Connected**: AriaLUI is running and ready to receive downloads
- 🔴 **Disconnected**: AriaLUI is not running, downloads will be handled by your browser

When disconnected, a warning message is displayed in the popup to inform you that downloads will be handled by the browser.
