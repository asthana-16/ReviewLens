import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ReviewLens — AI Review Intelligence",
  description: "AI-powered review analysis dashboard for online store owners",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
