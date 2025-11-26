// Built-in theme definitions
export const BUILT_IN_THEMES = {
  'rose-pine': {
    meta: {
      version: 1,
      name: 'Rosé Pine',
      description: 'All natural pine, faux fur and a bit of soho vibes for the classy minimalist',
      variant: 'dark' as const,
    },
    colors: {
      core: {
        background: '#191724',
        foreground: '#e0def4',
        secondary_background: '#1f1d2e',
        border: '#26233a',
        accent: '#ebbcba',
      },
      accents: {
        blue: '#9ccfd8',
        green: '#31748f',
        magenta: '#c4a7e7',
        orange: '#f6c177',
        purple: '#c4a7e7',
        red: '#eb6f92',
        yellow: '#f6c177',
        cyan: '#9ccfd8',
      },
    },
  },
  'catppuccin-mocha': {
    meta: {
      version: 1,
      name: 'Catppuccin Mocha',
      description: 'Soothing pastel theme for the high-spirited',
      variant: 'dark' as const,
    },
    colors: {
      core: {
        background: '#1e1e2e',
        foreground: '#cdd6f4',
        secondary_background: '#181825',
        border: '#313244',
        accent: '#89b4fa',
      },
      accents: {
        blue: '#89b4fa',
        green: '#a6e3a1',
        magenta: '#cba6f7',
        orange: '#fab387',
        purple: '#cba6f7',
        red: '#f38ba8',
        yellow: '#f9e2af',
        cyan: '#89dceb',
      },
    },
  },
  'tokyo-night': {
    meta: {
      version: 1,
      name: 'Tokyo Night',
      description: 'A clean, dark theme that celebrates the lights of downtown Tokyo at night',
      variant: 'dark' as const,
    },
    colors: {
      core: {
        background: '#1a1b26',
        foreground: '#c0caf5',
        secondary_background: '#16161e',
        border: '#414868',
        accent: '#7aa2f7',
      },
      accents: {
        blue: '#7aa2f7',
        green: '#9ece6a',
        magenta: '#bb9af7',
        orange: '#ff9e64',
        purple: '#9d7cd8',
        red: '#f7768e',
        yellow: '#e0af68',
        cyan: '#7dcfff',
      },
    },
  },
  'dracula': {
    meta: {
      version: 1,
      name: 'Dracula',
      description: 'The popular Dracula theme',
      variant: 'dark' as const,
    },
    colors: {
      core: {
        background: '#282A36',
        foreground: '#F8F8F2',
        secondary_background: '#21222C',
        border: '#44475A',
        accent: '#8BE9FD',
      },
      accents: {
        blue: '#8BE9FD',
        green: '#50FA7B',
        magenta: '#FF79C6',
        orange: '#FFB86C',
        purple: '#BD93F9',
        red: '#FF5555',
        yellow: '#F1FA8C',
        cyan: '#8BE9FD',
      },
    },
  },
};

export type BuiltInThemeName = keyof typeof BUILT_IN_THEMES;

export interface CustomTheme {
  meta: {
    version: number;
    name: string;
    description: string;
    variant: 'dark' | 'light';
    icon?: string;
  };
  colors: {
    core: {
      background: string;
      foreground: string;
      secondary_background?: string;
      border: string;
      accent: string;
    };
    accents: {
      blue: string;
      green: string;
      magenta: string;
      orange: string;
      purple: string;
      red: string;
      yellow: string;
      cyan: string;
    };
  };
}

// Convert hex to HSL
function hexToHSL(hex: string): string {
  // Remove # if present
  hex = hex.replace('#', '');

  // Convert to RGB
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  h = Math.round(h * 360);
  s = Math.round(s * 100);
  const lPercent = Math.round(l * 100);

  return `${h} ${s}% ${lPercent}%`;
}

// Clear custom theme inline styles to allow CSS classes to work
export function clearCustomTheme(): void {
  const root = document.documentElement;
  
  // Remove all custom inline styles that applyTheme sets
  const propertiesToClear = [
    '--background',
    '--foreground',
    '--border',
    '--primary',
    '--primary-foreground',
    '--secondary',
    '--secondary-foreground',
    '--card',
    '--card-foreground',
    '--popover',
    '--popover-foreground',
    '--muted',
    '--muted-foreground',
    '--accent',
    '--accent-foreground',
    '--destructive',
    '--destructive-foreground',
    '--input',
    '--ring',
  ];

  propertiesToClear.forEach(prop => {
    root.style.removeProperty(prop);
  });
}

// Helper to lighten or darken a color
function adjustLightness(hsl: string, adjustment: number): string {
  const match = hsl.match(/(\d+)\s+(\d+)%\s+(\d+)%/);
  if (!match) return hsl;
  
  const h = parseInt(match[1]);
  const s = parseInt(match[2]);
  let l = parseInt(match[3]);
  
  l = Math.max(0, Math.min(100, l + adjustment));
  
  return `${h} ${s}% ${l}%`;
}

// Helper to desaturate a color (make it more muted)
function desaturate(hsl: string, amount: number): string {
  const match = hsl.match(/(\d+)\s+(\d+)%\s+(\d+)%/);
  if (!match) return hsl;
  
  const h = parseInt(match[1]);
  let s = parseInt(match[2]);
  const l = parseInt(match[3]);
  
  s = Math.max(0, s - amount);
  
  return `${h} ${s}% ${l}%`;
}

// Helper to determine if a color is light (needs dark text) or dark (needs light text)
function isLightColor(hsl: string): boolean {
  const match = hsl.match(/(\d+)\s+(\d+)%\s+(\d+)%/);
  if (!match) return false;
  
  const l = parseInt(match[3]);
  return l > 50; // If lightness > 50%, it's a light color
}

// Get contrasting foreground color (dark text for light backgrounds, light text for dark backgrounds)
function getContrastingForeground(backgroundHSL: string, darkColor: string, lightColor: string): string {
  return isLightColor(backgroundHSL) ? darkColor : lightColor;
}


// Apply theme to CSS variables
export function applyTheme(theme: CustomTheme | typeof BUILT_IN_THEMES[BuiltInThemeName]): void {
  const root = document.documentElement;

  // Convert all colors first
  const bgHSL = hexToHSL(theme.colors.core.background);
  const fgHSL = hexToHSL(theme.colors.core.foreground);
  const borderHSL = hexToHSL(theme.colors.core.border);
  const accentHSL = hexToHSL(theme.colors.core.accent);
  const secondaryBgHSL = theme.colors.core.secondary_background 
    ? hexToHSL(theme.colors.core.secondary_background)
    : adjustLightness(bgHSL, theme.meta.variant === 'dark' ? 5 : -5);
  
  // Core colors
  root.style.setProperty('--background', bgHSL);
  root.style.setProperty('--foreground', fgHSL);
  root.style.setProperty('--border', borderHSL);

  // Primary - use theme's main accent color with contrasting text
  root.style.setProperty('--primary', accentHSL);
  // Calculate contrasting foreground - use dark text on light buttons, light text on dark buttons
  const primaryFg = getContrastingForeground(accentHSL, bgHSL, fgHSL);
  root.style.setProperty('--primary-foreground', primaryFg);

  // Secondary - slightly different from background
  root.style.setProperty('--secondary', secondaryBgHSL);
  root.style.setProperty('--secondary-foreground', fgHSL);

  // Card - use secondary background for depth
  root.style.setProperty('--card', secondaryBgHSL);
  root.style.setProperty('--card-foreground', fgHSL);

  // Popover - same as background
  root.style.setProperty('--popover', bgHSL);
  root.style.setProperty('--popover-foreground', fgHSL);

  // Muted - use border for background, and a desaturated foreground
  root.style.setProperty('--muted', borderHSL);
  root.style.setProperty('--muted-foreground', desaturate(fgHSL, 30));

  // Accent - use a lighter/darker version of background with border
  root.style.setProperty('--accent', borderHSL);
  root.style.setProperty('--accent-foreground', fgHSL);

  // Destructive - use red accent
  root.style.setProperty('--destructive', hexToHSL(theme.colors.accents.red));
  root.style.setProperty('--destructive-foreground', fgHSL);

  // Input and ring - use accent color for focus
  root.style.setProperty('--input', borderHSL);
  root.style.setProperty('--ring', accentHSL);

  // Set theme variant class
  root.classList.remove('light', 'dark');
  root.classList.add(theme.meta.variant);
}



export function getBuiltInTheme(name: BuiltInThemeName): typeof BUILT_IN_THEMES[BuiltInThemeName] {
  return BUILT_IN_THEMES[name];
}

export function isBuiltInTheme(name: string): name is BuiltInThemeName {
  return name in BUILT_IN_THEMES;
}
