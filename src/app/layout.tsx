import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Generatemedia - AI Image Generation",
  description: "Generate images with kie.ai",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-gray-50 antialiased">
        {children}
      </body>
    </html>
  );
}
