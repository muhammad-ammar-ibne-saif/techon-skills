import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "@/lib/services/i18react-next";
import Providers from "@/lib/providers";
import { TopLoaderWrapper } from "@/lib/ui/useable-components/top-loader-wrapper";
import { Toaster } from 'react-hot-toast';
import { ReactNode } from "react";
import { ServiceWorkerRegistrar } from "@/lib/ui/useable-components/push-notifications";


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_NAME = "TechOn Skills"
const DEFAULT_DESCRIPTION = "Modern, outcome-driven training in web development, mobile app development, software engineering, and e-commerce (Shopify + WordPress + Wix). Starting from PKR 2,500/month only. Career support for top performers."

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#071a2b",
}

export const metadata: Metadata = {
  title: { default: `${SITE_NAME} - Learn Web Development, Mobile Apps & Software Engineering`, template: `%s | ${SITE_NAME}` },
  description: DEFAULT_DESCRIPTION,
  openGraph: {
    title: SITE_NAME,
    description: DEFAULT_DESCRIPTION,
    type: "website",
    siteName: SITE_NAME,
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: DEFAULT_DESCRIPTION,
  },
  robots: { index: true, follow: true },
  applicationName: SITE_NAME,
  appleWebApp: { capable: true, title: "TechOn", statusBarStyle: "default" },
  icons: { apple: "/icons/apple-touch-icon.png" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {

  return (
    <html lang="en" className="min-w-0">
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-w-0 antialiased`}
      >
        <TopLoaderWrapper />
        <Providers>
          <Toaster position="bottom-right" />
          <ServiceWorkerRegistrar />
          {children}
        </Providers>
      </body>
    </html>
  );
}
