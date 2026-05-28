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

const css = `/* Plate by RomeDigital — Brand Theme */
:root {
  --background: #faf8f5;
  --foreground: #1c1917;
  --color-cream: #faf8f5;
  --color-surface: #ffffff;
  --color-card: #fefdfb;
  --color-border: #e7e0d8;
  --color-primary: #d45d3a;
  --color-primary-hover: #c44a2a;
  --color-secondary: #2d5a27;
  --color-gold: #c4943c;
  --color-text: #1c1917;
  --color-muted: #78716c;
  --radius-xl: 16px;
}

body {
  background: var(--background);
  color: var(--foreground);
  font-family: var(--font-body, Inter), sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}`;

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
      <body className="min-h-full flex flex-col">
        <style>{css}</style>
        {children}
      </body>
    </html>
  );
}
