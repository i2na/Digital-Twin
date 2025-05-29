import type { Metadata } from "next";
import "@/styles/globals.css";
import Script from "next/script";

export const metadata: Metadata = {
  title: "AirMonitor",
  description: "국민대학교 미래관 5층 온습도 모니터링 대시보드",
  openGraph: {
    title: "AirMonitor",
    description: "국민대학교 미래관 5층 온습도 모니터링 대시보드",
    type: "website",
  },
  icons: {
    icon: "/assets/favicon.png",
  },
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
    <html lang="en">
      <head>
        <Script
          src="https://developer.api.autodesk.com/modelderivative/v2/viewers/7.*/viewer3D.min.js"
          strategy="beforeInteractive"
        />
        <link
          rel="stylesheet"
          href="https://developer.api.autodesk.com/modelderivative/v2/viewers/7.*/style.min.css"
        />
      </head>
      <body className="font-pretendard">{children}</body>
    </html>
  );
}
