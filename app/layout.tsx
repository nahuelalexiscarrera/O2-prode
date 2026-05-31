/**
 * O2 PRODE — Root Layout
 * Agente 7 · Next.js Architect
 *
 * Loads Anton + Inter via next/font (no Google Fonts runtime requests).
 * Wraps app in providers and global CSS.
 */

import type { Metadata, Viewport } from "next";
import { Anton, Hanken_Grotesk } from "next/font/google";
import "./styles/globals.css";
import { ToastProvider } from "@/components/ui/Toast";

const anton = Anton({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-anton",
  display: "swap",
});

const hanken = Hanken_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-hanken",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "O2 PRODE — Mundial 2026",
    template: "%s · O2 PRODE",
  },
  description:
    "Competí con tus compañeros del gimnasio O2. Predecí los partidos del Mundial 2026 y demostrá que sabés de fútbol.",
  applicationName: "O2 PRODE",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16.png", type: "image/png", sizes: "16x16" },
      { url: "/favicon-32.png", type: "image/png", sizes: "32x32" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    title: "O2 PRODE",
    statusBarStyle: "black-translucent",
  },
  openGraph: {
    type: "website",
    locale: "es_AR",
    title: "O2 PRODE — Mundial 2026",
    description: "El prode del gimnasio O2 para el Mundial 2026.",
    siteName: "O2 PRODE",
  },
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#0B0B0D",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es-AR" className={`${anton.variable} ${hanken.variable}`}>
      <body>
        {/* Icon sprite (inlined for offline / instant access) */}
        <svg aria-hidden="true" style={{ position: "absolute", width: 0, height: 0 }}>
          <use href="/design/icons.svg" />
        </svg>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
