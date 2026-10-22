import type { Metadata } from "next";
import "./globals.css";
import './editor-controls.css';
import './masters.css';
import './public-card.css';
import './design-editor.css';
import './management.css';
import './app-shell.css';
import './studio-ui.css';

export const metadata: Metadata = {
  icons: {
    icon: [{ url: "/TTW-Logo.png", type: "image/png" }],
    shortcut: "/TTW-Logo.png",
    apple: "/TTW-Logo.png",
  },
  robots: { index: false, follow: false, noarchive: true },
  title: "CardStudio - Digital Business Card SaaS",
  description: "Create QR-enabled digital business cards with public profile pages."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
