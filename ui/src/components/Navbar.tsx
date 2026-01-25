import { Link } from "react-router-dom"
import { useTheme } from "@/components/theme-provider"
import { Sun, Moon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import React from "react"

const links = [
  { href: "/#about", label: "About" },
  { href: "/#projects", label: "Projects" },
  { href: "/#thesis", label: "Thesis" },
  { href: "/#contact", label: "Contact" },
];

export default function Navbar() {
  const { resolvedTheme, setTheme } = useTheme()
  const toggle = () => setTheme(resolvedTheme === "dark" ? "light" : "dark")
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <nav className="fixed top-0 w-full z-50 backdrop-blur-md bg-black/30 dark:bg-black/40 shadow-sm border-b border-border/40 dark:border-border/20">
      <div className="max-w-4xl mx-auto flex items-center justify-between px-4 py-3">
        <Link to="/" className="font-semibold text-xl hover:opacity-80 transition-opacity cursor-pointer">
          Portfolio
        </Link>
        
        <div className="flex items-center gap-1">
          {links.map((link, index) => (
            <div key={link.href} className="flex items-center">
              <Button variant="ghost" size="sm" asChild>
                <a href={link.href} className="text-sm">
                  {link.label}
                </a>
              </Button>
              {index < links.length - 1 && (
                <Separator orientation="vertical" className="h-4 mx-1" />
              )}
            </div>
          ))}
          
          <Separator orientation="vertical" className="h-4 mx-2" />
          
          {mounted && (
            <Button
              variant="outline"
              size="icon"
              onClick={toggle}
              aria-label="Toggle theme"
              className="cursor-pointer"
            >
              {resolvedTheme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
} 
