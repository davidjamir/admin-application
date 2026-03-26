import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

export function useLogin() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [isDark, setIsDark] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
    const isDarkGlobal = document.documentElement.classList.contains("dark")
    setIsDark(isDarkGlobal)
  }, [])

  const toggleTheme = useCallback(() => {
    const newTheme = !isDark
    setIsDark(newTheme)
    if (newTheme) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }, [isDark])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (res.ok) {
        toast.success("Protocol Success", {
          description: "System access granted. Welcome back.",
          duration: 3000,
        })
        router.push("/")
        router.refresh()
      } else {
        toast.error("Protocol Denial", {
          description: data.message || "Credential mismatch detected.",
        })
      }
    } catch {
      toast.error("Infrastructure Error", {
        description: "Node synchronization failed.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return {
    email, setEmail, password, setPassword,
    isLoading, mounted, isDark, toggleTheme, handleLogin
  }
}
