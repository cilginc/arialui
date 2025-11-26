# Custom Themes for AriaLUI

This directory contains example theme files. To create your own custom theme:

1. Copy one of the example files (e.g., `rose-pine.example.toml`)
2. Rename it to your theme name (e.g., `my-theme.toml`)
3. Customize the colors to your preference
4. Save the file in your user data directory under `themes/`

## Theme File Location

The themes directory is located at:

- **Windows**: `C:\Users\YourUsername\AppData\Roaming\arialui\themes\`
- **macOS**: `~/Library/Application Support/arialui/themes/`
- **Linux**: `~/.config/arialui/themes/`

## Theme File Structure

```toml
[meta]
version = 1
name = "My Theme Name"
description = "A description of your theme"
variant = "dark"  # or "light"

[colors.core]
background = "#1a1b26"
foreground = "#c0caf5"
secondary_background = "#16161e"
border = "#414868"
accent = "#7aa2f7"

[colors.accents]
blue = "#7aa2f7"
green = "#9ece6a"
magenta = "#bb9af7"
orange = "#ff9e64"
purple = "#9d7cd8"
red = "#f7768e"
yellow = "#e0af68"
cyan = "#7dcfff"
```

## Using Custom Themes

1. Place your `.toml` theme file in the themes directory
2. Open AriaLUI and go to Settings → Appearance
3. The application will automatically detect your custom theme
4. Select your theme from the dropdown

## Color Format

All colors must be in hexadecimal format (e.g., `#1a1b26`).

## Built-in Themes

AriaLUI includes these built-in themes:

- **Rose Pine** - All natural pine, faux fur and a bit of soho vibes
- **Catppuccin Mocha** - Soothing pastel theme for the high-spirited
- **Tokyo Night** - A clean, dark theme celebrating Tokyo at night
- **Dracula** - The popular Dracula theme
