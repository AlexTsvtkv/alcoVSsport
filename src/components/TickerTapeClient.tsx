"use client";

import React from 'react';
import { Beer, Dumbbell, Zap } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation'; 


type Broadcast = {
  id: string;
  message: string;
  type: 'sport' | 'bar' | 'neutral';
};

type Props = {
  broadcasts: Broadcast[];
  isVisible: boolean; // <--- Добавили флаг видимости
};

export default function TickerTapeClient({ broadcasts, isVisible }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const router = useRouter(); // <--- НОВЫЙ ХУК
 // Если эфир пуст, показываем призыв пригласить друзей

 // Тихое обновление данных каждые 60 секунд для "ловли" новых статусов друзей
 // Умный таймер, который работает только когда лента включена
  useEffect(() => {
    if (!isVisible) return; // База данных отдыхает

    const intervalId = setInterval(() => {
      router.refresh(); 
    }, 60 * 1000); 

    return () => clearInterval(intervalId);
  }, [router, isVisible]);

  // Если лента скрыта — вообще не рендерим её (ноль нагрузки на браузер)
  if (!isVisible) {
    return null;
  }


  const items = broadcasts.length > 0 ? broadcasts : [
    { id: 'default', message: 'ЛЕНТА ПУСТА. ПРИГЛАСИ ДРУЗЕЙ, ЧТОБЫ БЫТЬ В КУРСЕ!', type: 'neutral' as const }
  ];

  const tapeContent = items.map((b, index) => {
    let colorClass = 'text-neutral-400';
    let Icon = Zap;

    if (b.type === 'sport') {
      colorClass = 'text-[#00FF66]';
      Icon = Dumbbell;
    }
    if (b.type === 'bar') {
      colorClass = 'text-[#FF6B00]';
      Icon = Beer;
    }

    return (
      <React.Fragment key={b.id + index}>
        <span className={`flex items-center gap-1.5 font-black uppercase tracking-widest ${colorClass}`}>
          <Icon size={12} strokeWidth={3} className="mb-0.5" /> 
          {b.message}
        </span>
        <span className="text-neutral-700 mx-4">+++</span>
      </React.Fragment>
    );
  });

  return (
    <div className="sticky top-0 w-full bg-black border-b border-neutral-900 overflow-hidden py-3.5 relative flex z-50 shrink-0 shadow-[0_4px_20px_rgba(0,0,0,0.8)]">
      <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-black to-transparent z-10" />
      <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-black to-transparent z-10" />

      {/* Я немного увеличил размер текста с text-[10px] до text-xs для читаемости */}
      <div className="flex whitespace-nowrap animate-marquee text-xs">
        <div className="flex shrink-0 px-2 items-center">
          {tapeContent}
        </div>
        <div className="flex shrink-0 px-2 items-center">
          {tapeContent}
        </div>
      </div>
    </div>
  );
}