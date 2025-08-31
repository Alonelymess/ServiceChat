import type React from "react"
import type { Metadata } from "next"
import { Public_Sans } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Navigation } from "@/components/navigation"
import { Suspense } from "react"
import "./globals.css"

const publicSans = Public_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-public-sans",
})

export const metadata: Metadata = {
  title: "ServiceChat - NSW Government Services Assistant",
  description: "AI-powered assistant for navigating NSW government services",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans ${publicSans.variable}`}>
        <Suspense fallback={<div>Loading...</div>}>
          <Navigation />
        </Suspense>
        <main className="min-h-screen">{children}</main>
        <Analytics />
      </body>
    </html>
  )
}
