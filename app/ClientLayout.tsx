"use client"

import { useEffect, useState } from "react"
import styles from "@/styles/BackgroundAnimation.module.css"

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isSmallScreen, setIsSmallScreen] = useState(false)

  useEffect(() => {
    const checkScreenSize = () => {
      setIsSmallScreen(window.innerWidth <= 768)
    }

    checkScreenSize()
    window.addEventListener("resize", checkScreenSize)

    return () => window.removeEventListener("resize", checkScreenSize)
  }, [])

  return (
    <body>
      {!isSmallScreen && <div className={styles.backgroundAnimation}></div>}
      {children}
    </body>
  )
}

