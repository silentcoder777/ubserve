import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Ubserve — Local help, on your terms",
  description:
    "Discover local service providers, compare prices, and book home services in Ames.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
