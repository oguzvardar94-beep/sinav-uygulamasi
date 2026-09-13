import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sınav Atölyesi | Ortaokul sınav hazırlama",
  description: "5-8. sınıflar için müfredata uygun sınav hazırlama çalışma alanı.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="tr"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
