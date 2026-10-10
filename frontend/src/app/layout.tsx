import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CardStudio - Digital Business Card SaaS",
  description: "Create QR-enabled digital business cards with public profile pages."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
