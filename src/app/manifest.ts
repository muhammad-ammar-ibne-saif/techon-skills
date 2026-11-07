import type { MetadataRoute } from "next"

/** Makes the portal installable as an app (phone home screen, desktop). */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "TechOn Skills",
    short_name: "TechOn",
    description: "Your TechOn Skills classes, recordings, assignments and fees in one app.",
    id: "/",
    start_url: "/student/dashboard",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#3B3BF5",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  }
}
