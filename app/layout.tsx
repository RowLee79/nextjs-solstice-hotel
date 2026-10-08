import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Solstice Hotel | Book Your Stay",
  description: "Explore rooms, check live availability and reserve your next stay.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
