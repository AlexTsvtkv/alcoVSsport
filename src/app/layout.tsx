import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import TickerTape from "@/components/TickerTape";

const inter = Inter({ subsets: ["latin", "cyrillic"] });

export const metadata: Metadata = {
  title: "Alco vs Sport",
  description: "Баланс твоей жизни",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className={`${inter.className} bg-black min-h-screen flex justify-center`}>
        {/* Ограничивающий контейнер приложения */}
        <main className="w-full max-w-md bg-[#0D0F12] min-h-screen relative flex flex-col shadow-2xl border-x border-neutral-900 overflow-hidden">
          
          {/* Бегущая строка теперь живет внутри мобильного контейнера */}
          <TickerTape />
          {/* Остальной контент страниц */}
          <div className="flex-1 flex flex-col">
            {children}
          </div>
          
        </main>
      </body>
    </html>
  );
}