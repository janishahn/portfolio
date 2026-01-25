import { createContext, useContext, useEffect, useMemo, useState } from "react"
import type { ReactNode } from "react"

type Theme = "light" | "dark" | "system"

type ThemeContextValue = {
  theme: Theme
  setTheme: (theme: Theme) => void
  resolvedTheme: "light" | "dark"
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

function resolveTheme(theme: Theme) {
  if (theme === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
  }
  return theme
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = localStorage.getItem("theme") as Theme | null
    return stored ?? "system"
  })
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light")

  useEffect(() => {
    const applyTheme = () => {
      const nextResolved = resolveTheme(theme)
      setResolvedTheme(nextResolved)
      document.documentElement.classList.toggle("dark", nextResolved === "dark")
    }

    applyTheme()
    localStorage.setItem("theme", theme)

    const media = window.matchMedia("(prefers-color-scheme: dark)")
    const handleChange = () => {
      if (theme === "system") {
        applyTheme()
      }
    }
    media.addEventListener("change", handleChange)
    return () => media.removeEventListener("change", handleChange)
  }, [theme])

  const value = useMemo(
    () => ({ theme, setTheme, resolvedTheme }),
    [theme, resolvedTheme]
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const value = useContext(ThemeContext)
  if (!value) {
    throw new Error("useTheme must be used within ThemeProvider")
  }
  return value
}
