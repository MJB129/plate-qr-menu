import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";

const playfairDisplay = Playfair_Display({
  variable: "--font-heading",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Plate by RomeDigital — QR Menu Dashboard",
  description: "Create and manage beautiful QR-code digital menus for your restaurant.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${playfairDisplay.variable} ${inter.variable} h-full antialiased`}
    >
      <head>
        <style>{`
          /* Pre-paint fallback: brand tokens available before Tailwind CSS loads.
             These are not utility classes — Tailwind owns those. */
          :root {
            --color-cream: #faf8f5;
            --color-surface: #ffffff;
            --color-border: #e7e0d8;
            --color-primary: #d45d3a;
            --color-text: #1c1917;
            --color-muted: #78716c;
          }
          body {
            background: #faf8f5;
            color: #1c1917;
            margin: 0;
          }
        `}</style>
      </head>
      <body className="min-h-full flex flex-col">
        {children}
      </body>
    </html>
  );
}
