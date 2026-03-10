import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import TimezoneProvider from "@/components/ui/TimezoneProvider";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-heading",
});

export const metadata: Metadata = {
  title: "Pursuit",
  description: "Goal tracking with the GPS method",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${poppins.variable}`}>
      <body className="font-sans antialiased">
        <TimezoneProvider />
        {children}
      </body>
    </html>
  );
}