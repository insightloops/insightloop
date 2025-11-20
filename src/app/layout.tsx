import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { Navigation } from "@/components/Navigation";
import { APIKeyProvider } from "@/contexts/APIKeyContext";
import { APIKeySettings } from "@/components/APIKeySettings";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "InsightLoop - AI-Powered Feedback Analytics",
  description: "Transform fragmented customer feedback into structured, actionable product insights using AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <APIKeyProvider>
            <div className="min-h-screen bg-background">
              <header className="border-b">
                <div className="container mx-auto px-4 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-8">
                      <h1 className="text-xl font-bold">InsightLoop</h1>
                      <Navigation />
                    </div>
                    <div className="flex items-center gap-2">
                      <APIKeySettings />
                      <ThemeToggle />
                    </div>
                  </div>
                </div>
              </header>
              <main className="container mx-auto px-4 py-8">
                {children}
              </main>
            </div>
          </APIKeyProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
