import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Keahlian UMNOSiswa Malaysia",
  description: "Portal Keahlian UMNOSiswa Malaysia"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ms">
      <body>{children}</body>
    </html>
  );
}
