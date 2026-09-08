import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.umnosiswa.my"),
  title: {
    default: "UMNOSiswa Malaysia | Portal Rasmi Keahlian",
    template: "%s | UMNOSiswa Malaysia",
  },
  description:
    "Portal rasmi UMNOSiswa Malaysia untuk pendaftaran keahlian, semakan status ahli, kad keahlian digital dan maklumat organisasi.",
  applicationName: "UMNOSiswa Malaysia",
  keywords: [
    "UMNOSiswa",
    "UMNOSiswa Malaysia",
    "Portal Keahlian UMNOSiswa",
    "Keahlian UMNOSiswa",
    "Mahasiswa UMNO",
  ],
  authors: [{ name: "UMNOSiswa Malaysia" }],
  creator: "UMNOSiswa Malaysia",
  publisher: "UMNOSiswa Malaysia",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "ms_MY",
    url: "/",
    siteName: "UMNOSiswa Malaysia",
    title: "UMNOSiswa Malaysia | Portal Rasmi Keahlian",
    description:
      "Portal rasmi UMNOSiswa Malaysia untuk pendaftaran keahlian, semakan status ahli, kad keahlian digital dan maklumat organisasi.",
    images: [
      {
        url: "/umnos-logo.jpeg",
        alt: "UMNOSiswa Malaysia",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "UMNOSiswa Malaysia | Portal Rasmi Keahlian",
    description:
      "Portal rasmi UMNOSiswa Malaysia untuk pendaftaran keahlian, semakan status ahli, kad keahlian digital dan maklumat organisasi.",
    images: ["/umnos-logo.jpeg"],
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon.png", type: "image/png" },
    ],
    apple: "/apple-icon.png",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const websiteStructuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "UMNOSiswa Malaysia",
    alternateName: "UMNOSiswa",
    url: "https://www.umnosiswa.my/",
  };

  return (
    <html lang="ms">
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(websiteStructuredData),
          }}
        />
        {children}
      </body>
    </html>
  );
}
