# Arialui

Arialui is a simple and modern UI for Aria2 and other download backends.

## Browser Extension

AriaLUI includes a browser extension that automatically captures downloads and sends them to the application.

### Features

- **Automatic Download Interception**: All downloads are automatically sent to AriaLUI (can be disabled)
- **Context Menu Integration**: Right-click any link and select "Download with AriaLUI"
- **Connection Status**: Visual indicator showing if AriaLUI is running
- **Quick Actions**: Send current tab URL directly to AriaLUI
- **Settings**: Toggle automatic interception on/off

### Installation

1. Make sure AriaLUI application is installed and running
2. Install some backend like aria2 (with winget preferred)
3. Install the browser extension

### Usage

**Automatic Mode (Default)**:

- Simply click any download link - it will automatically be sent to AriaLUI
- The browser's default download will be cancelled
- A notification will confirm the download was sent

**Context Menu**:

- Right-click on any link, image, video, or audio file
- Select "Download with AriaLUI" from the context menu
- The download will be added to AriaLUI

**Extension Popup**:

- Click the AriaLUI extension icon in your browser toolbar
- View connection status
- Toggle automatic download interception on/off
- Send current tab URL to AriaLUI
- Refresh connection status

### Troubleshooting

**Extension shows "Disconnected"**:

- Make sure the AriaLUI application is running
- Check that the application is not blocked by your firewall
- The extension communicates with AriaLUI on `localhost:6801`

**Downloads not being intercepted**:

- Check that automatic interception is enabled in the extension popup
- Some downloads (like very small files or data URLs) are not intercepted
- Try using the context menu as an alternative

## Example Configuration File for AriaLUI

```toml
# This file demonstrates all available configuration options

version = 1

[theme]

# Theme mode can be: 'light', 'dark', 'system', 'rose-pine', 'catppuccin-mocha', 'tokyo-night', 'dracula', or 'custom'

mode = "dark"

# If mode is 'custom', specify the custom theme file name (without .toml extension)

# customThemeName = "my-custom-theme"

[aria2]
port = 6800
secret = "arialui_secret_token"
rpcListenAll = false
rpcAllowOriginAll = true
maxConcurrentDownloads = 5
maxConnectionPerServer = 5
minSplitSize = "10M"
split = 5
downloadDir = "C:\\Users\\YourUser\\Downloads" # Windows path example

[general]
downloadDirectory = "C:\\Users\\YourUser\\Downloads"
startMinimized = false
closeToTray = true
```
