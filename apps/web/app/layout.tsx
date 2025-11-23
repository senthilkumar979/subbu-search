import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'

import "@workspace/ui/globals.css"
import { Providers } from "@/components/providers"

const fontSans = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
})

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export const metadata: Metadata = {
  title: 'Special Intensive Revision | Thiruvarur District',
  description: 'Search electoral roll for Thiruvarur Assembly Constituency 210. Special Intensive Revision 2002 data.',
  keywords: ['electoral roll', 'voter search', 'Thiruvarur', 'AC 173', 'Special Intensive Revision', '2002 Data'],
  authors: [{ name: 'Thiruvarur District Election Department' }],
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    title: 'Special Intensive Revision | Thiruvarur District',
    description: 'Search electoral roll for Thiruvarur District - 2002 Data',
    type: 'website',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${fontSans.variable} ${fontMono.variable} font-sans antialiased `}
      >
        <Providers>{children}</Providers>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
