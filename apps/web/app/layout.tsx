import type { Metadata } from "next";
import "./globals.css";
import { AppProviders } from "@/providers/app-providers";

export const metadata: Metadata = {
  title: "BauWerk",
  description: "Handwerkersoftware für moderne Betriebe",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
