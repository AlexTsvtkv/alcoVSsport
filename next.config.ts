import type { NextConfig } from "next";
import withPWA from 'next-pwa';


const config: NextConfig = {
  typescript: {
    // Игнорировать ошибки проверки типов на Vercel при сборке
    ignoreBuildErrors: true,
  },
  turbopack: {},
  // ...остальные ваши настройки (например, для PWA)
};

const nextConfig = withPWA({
  dest: 'public', // Куда будут складываться сервис-воркеры
  register: true, // Автоматическая регистрация сервис-воркера
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development', // Отключаем PWA в режиме разработки, чтобы не мешал
})(config);

export default nextConfig;