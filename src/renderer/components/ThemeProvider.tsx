import React, { createContext, useContext, useEffect, useState } from "react"
import { applyTheme, getBuiltInTheme, isBuiltInTheme, clearCustomTheme, type BuiltInThemeName } from "@/lib/themes"
import type { AppConfig } from "../../main/config"

type Theme = "dark" | "light" | "system" | BuiltInThemeName | "custom"

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
  customThemeName?: string
}

const initialState: ThemeProviderState = {
  theme: "dark",
  setTheme: () => null,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export function ThemeProvider({
  children,
  defaultTheme = "dark",
  storageKey = "arialui-theme",
  ...props
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(defaultTheme)
  const [customThemeName, setCustomThemeName] = useState<string | undefined>()
  const [isInitialized, setIsInitialized] = useState(false)

  // Load configuration on mount
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const config = await window.electronAPI.getConfig()
        const configTheme = config.theme.mode
        setThemeState(configTheme)
        if (configTheme === 'custom') {
          setCustomThemeName(config.theme.customThemeName)
        }
        setIsInitialized(true)
      } catch (error) {
        console.error('Failed to load theme config:', error)
        setIsInitialized(true)
      }
    }
    loadConfig()
  }, [])

  useEffect(() => {
    if (!isInitialized) return

    const root = window.document.documentElement

    // Remove all theme classes
    root.classList.remove("light", "dark")

    const applyThemeClass = async () => {
      // Handle built-in custom themes (rose-pine, catppuccin, etc.)
      if (isBuiltInTheme(theme)) {
        const builtInTheme = getBuiltInTheme(theme as BuiltInThemeName)
        applyTheme(builtInTheme)
        return
      }

      // Handle custom theme from file
      if (theme === "custom" && customThemeName) {
        try {
          const customTheme = await window.electronAPI.loadCustomTheme(customThemeName)
          if (customTheme) {
            applyTheme(customTheme)
            return
          }
        } catch (error) {
          console.error('Failed to load custom theme:', error)
        }
      }

      // For light/dark/system, clear custom theme styles and use CSS classes
      clearCustomTheme()

      // Handle light/dark/system
      if (theme === "system") {
        const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
          .matches
          ? "dark"
          : "light"
        root.classList.add(systemTheme)
        return
      }

      // Add simple theme class (light or dark)
      if (theme === "light" || theme === "dark") {
        root.classList.add(theme)
      }
    }

    applyThemeClass()
  }, [theme, customThemeName, isInitialized])

  const setTheme = async (newTheme: Theme) => {
    setThemeState(newTheme)
    
    // Save to configuration
    try {
      await window.electronAPI.updateConfig({
        theme: {
          mode: newTheme,
          customThemeName: newTheme === 'custom' ? customThemeName : undefined,
        },
      })
    } catch (error) {
      console.error('Failed to save theme config:', error)
    }
  }

  const value = {
    theme,
    setTheme,
    customThemeName,
  }

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider")

  return context
}
