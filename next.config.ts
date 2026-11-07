import type { NextConfig } from "next";

type RemotePattern = NonNullable<NonNullable<NextConfig["images"]>["remotePatterns"]>[number];

/** Allow next/image to load from the configured API and S3 hosts (set per deployment). */
function patternFromUrl(value: string | undefined): RemotePattern[] {
  if (!value) return [];
  try {
    const url = new URL(value.includes("://") ? value : `https://${value}`);
    return [{ protocol: url.protocol.replace(":", "") as "http" | "https", hostname: url.hostname, pathname: "/**" }];
  } catch {
    return [];
  }
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      ...patternFromUrl(process.env.NEXT_PUBLIC_BACKEND_URL),
      ...patternFromUrl(process.env.NEXT_PUBLIC_S3_PUBLIC_BASE_URL),
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "techon-skills-api-production.up.railway.app",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "8080",
        pathname: "/**",
      },
      {
        // Path-style S3 URLs for any bucket in Mumbai (https://s3.ap-south-1.amazonaws.com/<bucket>/...)
        protocol: "https",
        hostname: "s3.ap-south-1.amazonaws.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "bucket.techonskills.s3.ap-south-1.amazonaws.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "ui-avatars.com",
        pathname: "/**",
      }
    ],
  },
};

export default nextConfig;
