import "@/styles/globals.css";
import { Analytics } from "@vercel/analytics/next";

import { GeistSans } from "geist/font/sans";
import { type Metadata } from "next";

export const metadata: Metadata = {
  title: "Blustar Data",
  description: "Data For Bluestar",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${GeistSans.variable}`}>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
