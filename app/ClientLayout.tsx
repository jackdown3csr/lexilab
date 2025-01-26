"use client"


import styles from "@/styles/BackgroundAnimation.module.css"

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <body>
      <div className={styles.layoutWrapper}>
        <div className={styles.backgroundAnimation}></div>
        <div className={styles.contentWrapper}>{children}</div>
      </div>
    </body>
  )
}

