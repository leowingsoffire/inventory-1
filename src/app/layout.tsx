import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/lib/context";
import { AuthProvider } from "@/lib/auth-context";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Unitech IT System - IT Inventory Management",
  description: "Professional IT Inventory Management System for Singapore SME",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} h-full`} suppressHydrationWarning>
      <body className="min-h-full antialiased">
        <AppProvider><AuthProvider>{children}</AuthProvider></AppProvider>
      </body>
    </html>
  );
}
