import type { Metadata, Viewport } from "next";
import Script from "next/script";

export const metadata: Metadata = {
  metadataBase: new URL("http://localhost:3013"),
  title: "Forge of Traders | Simulated Trading Evaluations",
  description:
    "Access simulated trading evaluations and accounts with clear risk rules, real-market data and performance rewards based on eligible simulated results.",
  icons: {
    icon: "/templates/template2/assets/91ffc6dad3ca75.webp",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#101010",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          rel="preload"
          href="/templates/template2/fonts/poppins-400.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/templates/template2/fonts/poppins-500.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/templates/template2/fonts/poppins-600.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/templates/template2/fonts/poppins-700.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <style>{`html{background:#101010;scrollbar-gutter:stable}body{margin:0}*,*::before,*::after{box-sizing:border-box}`}</style>
        <link
          id="forge-styles"
          rel="stylesheet"
          href="/templates/template2/assets/forge-6089a16ac694.css"
        />
        <link rel="stylesheet" href="/templates/template2/css/overrides.css" />
        <link rel="stylesheet" href="/assets/forge.css" />
        <link rel="stylesheet" href="/css/overrides.css" />
        <link rel="stylesheet" href="/style.css" />
      </head>
      <body>
        {children}
        <Script
          src="/common/js/jquery-3.7.1.min.js"
          strategy="beforeInteractive"
        />
        <Script
          src="/common/js/bootstrap.bundle.min.js"
          strategy="beforeInteractive"
        />
      </body>
    </html>
  );
}
