import "./globals.css";

export const metadata = {
  title: "ReviewLens — AI Review Intelligence",
  description: "AI-powered review analysis dashboard for online store owners",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
