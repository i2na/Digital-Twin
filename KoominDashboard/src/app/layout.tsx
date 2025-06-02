import type { Metadata } from "next";
import "@/styles/globals.css";
import Script from "next/script";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "KookminDashboard",
  description: "국민대학교 미래관 5층 온습도 모니터링 대시보드",
  openGraph: {
    title: "KookminDashboard",
    description: "국민대학교 미래관 5층 온습도 모니터링 대시보드",
    type: "website",
    images: [
      {
        url: "https://localhost:3000/thumbnail.png",
        alt: "KookminDashboard",
      },
    ],
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
      <body className="font-pretendard">
        <Toaster />
        {children}
      </body>
    </html>
  );
}
