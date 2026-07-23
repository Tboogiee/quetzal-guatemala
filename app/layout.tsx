import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("host") || "localhost:3000";
  const protocol = host.includes("localhost") ? "http" : "https";
  const image = `${protocol}://${host}/og.png`;
  return {
    title: "Quetzal — Your intelligent Guatemala travel companion",
    description: "Plan a smarter Guatemala trip with curated places, optimized routes, cultural events, live travel tools and practical local guidance.",
    icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
    openGraph: { title: "Quetzal — Guatemala, beautifully planned", description: "Curated places, intelligent routes, cultural events and live travel tools.", images: [{ url: image, width: 1200, height: 630 }] },
    twitter: { card: "summary_large_image", title: "Quetzal — Guatemala, beautifully planned", description: "Your intelligent Guatemala travel companion.", images: [image] },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
