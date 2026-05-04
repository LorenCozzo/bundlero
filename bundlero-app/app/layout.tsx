import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bundlero Quantity Breaks",
  description: "Boost your AOV with volume discounts",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
