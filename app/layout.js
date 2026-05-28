import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Depresso Haus | Admin Dashboard",
  description: "Advanced POS and Inventory Management System",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full">
      <body
        suppressHydrationWarning={true}
        className={`${geistSans.variable} ${geistMono.variable} antialiased h-full bg-[#f8f8f8] text-gray-900`}
      >
        {children}
      </body>
    </html>
  );
}