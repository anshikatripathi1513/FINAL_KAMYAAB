import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "KaamYaab AI — Interview Coach",
  description: "Practice interviews in the language you are comfortable with."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
