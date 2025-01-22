"use client"

import { useEffect } from "react"

interface AppInitializerProps {
  className?: string
}

export default function AppInitializer({ className }: AppInitializerProps) {
  useEffect(() => {
    const initApp = async () => {
      try {
        const response = await fetch("/api/init")
        if (!response.ok) {
          throw new Error("Failed to initialize application")
        }
      } catch (error) {}
    }

    initApp()
  }, [])

  return <div className={className}></div>
}

