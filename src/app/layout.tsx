import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    template: "Sashi | %s",
    default: "Sashi",
  },
  description: "Your personal task manager",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Toaster 
          theme="dark" 
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#1a1a1a',
              border: '1px solid #333',
              color: '#e5e5e5',
            },
          }}
        />
      </body>
    </html>
  );
}
