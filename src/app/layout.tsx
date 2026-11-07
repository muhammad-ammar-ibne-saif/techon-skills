import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "@/lib/services/i18react-next";
import Providers from "@/lib/providers";
import { TopLoaderWrapper } from "@/lib/ui/useable-components/top-loader-wrapper";
import { Toaster } from 'react-hot-toast';
import { ReactNode } from "react";
import { ServiceWorkerRegistrar } from "@/lib/ui/useable-components/push-notifications";
import { SITE } from "@/lib/seo/site";


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});


export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0E1116" },
  ],
}

const DEFAULT_TITLE = `${SITE.name}: ${SITE.headline}`

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: DEFAULT_TITLE, template: `%s | ${SITE.name}` },
  description: SITE.shortDescription,
  keywords: [...SITE.keywords],
  applicationName: SITE.name,
  authors: [{ name: SITE.name, url: SITE.url }],
  creator: SITE.name,
  publisher: SITE.legalName,
  category: "education",
  formatDetection: { telephone: true, email: true, address: true },
  openGraph: {
    title: DEFAULT_TITLE,
    description: SITE.shortDescription,
    type: "website",
    siteName: SITE.name,
    locale: SITE.locale,
    url: SITE.url,
  },
  twitter: {
    card: "summary_large_image",
    title: DEFAULT_TITLE,
    description: SITE.shortDescription,
    images: ["/opengraph-image"],
  },
  // Full snippets and large image previews let search and AI answers quote the page properly.
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-snippet": -1, "max-image-preview": "large", "max-video-preview": -1 },
  },
  appleWebApp: { capable: true, title: SITE.shortName, statusBarStyle: "default" },
  icons: { apple: "/icons/apple-touch-icon.png" },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || undefined,
    other: process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION ? { "msvalidate.01": process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION } : undefined,
  },
  other: { "geo.region": "PK-PB", "geo.placename": "Lahore" },
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
