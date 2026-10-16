import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Игнорировать ошибки проверки типов на Vercel при сборке
    ignoreBuildErrors: true,
  },
  // ...остальные ваши настройки (например, для PWA)
};

export default nextConfig;