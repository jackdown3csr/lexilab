import "./globals.css"
import type { Metadata } from "next"
import { Orbitron } from "next/font/google"

const orbitron = Orbitron({
  subsets: ["latin"],
  variable: "--font-orbitron",
  display: "swap",
})

export const metadata: Metadata = {
  title: "LexiLAB",
  description: "A word guessing game that challenges your vocabulary and deduction skills",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={orbitron.variable}>
      <body>{children}</body>
    </html>
  )
}

