"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  // Avoid hydration mismatch by rendering only after mounting
  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <button
        className="w-10 h-10 rounded-xl flex items-center justify-center border border-border bg-transparent text-fg hover:bg-muted transition-colors"
        aria-label="Toggle theme"
        type="button"
      >
        <span className="w-5 h-5" />
      </button>
    )
  }

  const isDark = resolvedTheme === "dark"

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="w-10 h-10 rounded-xl flex items-center justify-center border border-border bg-transparent text-fg hover:bg-muted transition-colors cursor-pointer"
      aria-label="Toggle theme"
      type="button"
    >
      {isDark ? (
        <Sun className="w-5 h-5 transition-all text-brand-400" />
      ) : (
        <Moon className="w-5 h-5 transition-all text-brand-600" />
      )}
    </button>
  )
}
