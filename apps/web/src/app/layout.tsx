import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LeadScaper Pro — SaaS Lead Generation Platform",
  description:
    "Extract high-quality business leads from Google Maps. Manage projects, run WhatsApp campaigns, track analytics, and export data — all from one premium dashboard.",
  keywords: [
    "lead generation",
    "Google Maps scraping",
    "business leads",
    "WhatsApp campaigns",
    "SaaS",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen antialiased" data-theme="dark">
        {children}
      </body>
    </html>
  );
}
