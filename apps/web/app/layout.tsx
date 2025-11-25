import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { Providers } from "@/components/providers";
import "@workspace/ui/globals.css";

const fontSans = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
});

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Thiruvarur - Special Intensive Revision 2002 Data",
  description:
    "Search Electoral Roll for Thiruvarur Assembly Constituency 210. Special Intensive Revision 2002 data.",
  keywords: [
    "Electoral Roll",
    "voter search",
    "Thiruvarur",
    "AC 173",
    "2002 Data",
  ],
  authors: [
    {
      name: "Thiruvarur District Election Department",
      url: "https://mentorbridge.in",
    },
  ],
  creator: "MentorBridge",
  publisher: "MentorBridge",
  applicationName: "Thiruvarur - Special Intensive Revision 2002 Data",
  category: "government",
  icons: {
    icon: "/eci-logo.png",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "Thiruvarur - Special Intensive Revision 2002 Data",
    description: "Search Electoral Roll for Thiruvarur District - 2002 Data",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
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
  );
}
