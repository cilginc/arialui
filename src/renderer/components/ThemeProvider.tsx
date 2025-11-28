import React, { createContext, useContext, useEffect, useState } from "react"
import { applyTheme, clearCustomTheme } from "@/lib/themes"
// import type { AppConfig } from "../../main/config"

type Theme = "dark" | "light" | "system" | "custom" | string

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
  // storageKey = "arialui-theme",
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
      // Handle system theme - load appropriate TOML file based on system preference
      if (theme === "system") {
        const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
          .matches
          ? "dark"
          : "light"
        
        try {
          const customTheme = await window.electronAPI.loadCustomTheme(systemTheme)
          if (customTheme) {
            applyTheme(customTheme)
            return
          }
        } catch (error) {
          console.error('Failed to load system theme:', error)
        }
        
        // Fallback to dark if loading fails
        root.classList.add('dark')
        return
      }

      // Handle light and dark themes - load from TOML files
      if (theme === "light" || theme === "dark") {
        try {
          const customTheme = await window.electronAPI.loadCustomTheme(theme)
          if (customTheme) {
            applyTheme(customTheme)
            return
          }
        } catch (error) {
          console.error(`Failed to load ${theme} theme:`, error)
        }
        
        // Fallback - apply class directly if TOML fails to load
        clearCustomTheme()
        root.classList.add(theme)
        return
      }

      // Handle custom themes (including previously built-in ones)
      // If theme is "custom", use customThemeName. Otherwise use theme as the name.
      const themeName = theme === "custom" ? customThemeName : theme;
      
      if (themeName) {
        try {
          const customTheme = await window.electronAPI.loadCustomTheme(themeName)
          if (customTheme) {
            applyTheme(customTheme)
            return
          }
        } catch (error) {
          console.error('Failed to load custom theme:', error)
        }
      }

      // Fallback to dark if theme loading fails
      clearCustomTheme()
      root.classList.add('dark')
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

// eslint-disable-next-line react-refresh/only-export-components
export const useTheme = () => {
  const context = useContext(ThemeProviderContext)

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider")

  return context
}
