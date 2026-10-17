import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import TickerTape from "@/components/TickerTape";

const inter = Inter({ subsets: ["latin", "cyrillic"] });

export const viewport: Viewport = {
  themeColor: "#0D0F12",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // Отключаем зум, чтобы было похоже на нативное приложение
};

export const metadata: Metadata = {
  title: "Alco vs Sport",
  description: "Баланс твоей жизни",
  manifest: "/manifest.json", // Ссылка на наш манифест
  appleWebApp: {
    capable: true, // Важно для iOS
    statusBarStyle: "black-translucent",
    title: "Alco-vs-Sport",
  },
  icons: {
    apple: "/icon-192x192.png", // <--- ОБЯЗАТЕЛЬНО ДЛЯ АЙФОНОВ
  },
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
        <main className="w-full  max-w-md bg-[#0D0F12] min-h-screen relative flex flex-col shadow-2xl border-x border-neutral-900 overflow-hidden">
          
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