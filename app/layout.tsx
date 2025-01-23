import "./globals.css"
import type { Metadata } from "next"
import { Orbitron } from "next/font/google"
import ClientLayout from "./ClientLayout"

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
      <ClientLayout>{children}</ClientLayout>
    </html>
  )
}

