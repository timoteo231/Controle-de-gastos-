import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Controle de Compras",
  description: "Suas compras, notas e impostos em um só lugar.",
  manifest: "/manifest.webmanifest"
};

export const viewport: Viewport = {
  themeColor: "#10110f",
  width: "device-width",
  initialScale: 1
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR"><body>{children}</body></html>;
}
