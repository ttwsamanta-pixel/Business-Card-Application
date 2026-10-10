import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CardStudio — Business Card Templates",
  description: "Choose and preview a digital business card template."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
