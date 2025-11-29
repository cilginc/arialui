import { app } from 'electron';
import path from 'path';
import fs from 'fs';

export function setupAutostart(enable: boolean): void {
  if (process.platform === 'darwin' || process.platform === 'win32') {
    app.setLoginItemSettings({
      openAtLogin: enable,
      path: app.getPath('exe'),
    });
  } else if (process.platform === 'linux') {
    setupLinuxAutostart(enable);
  }
}

export function isAutostartEnabled(): boolean {
  if (process.platform === 'darwin' || process.platform === 'win32') {
    return app.getLoginItemSettings().openAtLogin;
  } else if (process.platform === 'linux') {
    return isLinuxAutostartEnabled();
  }
  return false;
}

function getLinuxAutostartPath(): string {
  const configDir = app.getPath('home');
  return path.join(configDir, '.config', 'autostart', 'arialui.desktop');
}

function setupLinuxAutostart(enable: boolean): void {
  const autostartPath = getLinuxAutostartPath();
  const autostartDir = path.dirname(autostartPath);

  try {
    if (enable) {
      if (!fs.existsSync(autostartDir)) {
        fs.mkdirSync(autostartDir, { recursive: true });
      }

      const desktopEntry = `[Desktop Entry]
Type=Application
Version=${app.getVersion()}
Name=AriaLUI
Comment=AriaLUI Download Manager
Exec="${app.getPath('exe')}"
Terminal=false
Categories=Network;FileTransfer;
StartupNotify=false
X-GNOME-Autostart-enabled=true
`;
      fs.writeFileSync(autostartPath, desktopEntry, 'utf-8');
    } else {
      if (fs.existsSync(autostartPath)) {
        fs.unlinkSync(autostartPath);
      }
    }
  } catch (error) {
    console.error('Failed to update Linux autostart configuration:', error);
  }
}

function isLinuxAutostartEnabled(): boolean {
  return fs.existsSync(getLinuxAutostartPath());
}
