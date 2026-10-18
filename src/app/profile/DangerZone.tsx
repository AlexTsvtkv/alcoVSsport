"use client";

import { useState, useEffect } from 'react';
import { resetStats, type ResetPeriod } from '@/actions/activities';
import { Settings, AlertTriangle, X } from 'lucide-react';

export default function DangerZone() {
  const [isOpen, setIsOpen] = useState(false);
  const [resettingPeriod, setResettingPeriod] = useState<ResetPeriod | null>(null);

  // Блокируем скролл страницы, когда шторка открыта
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleReset = async (period: ResetPeriod) => {
    const periodNames = {
      today: 'ЗА СЕГОДНЯ',
      week: 'ЗА ПОСЛЕДНИЕ 7 ДНЕЙ',
      month: 'ЗА ЭТОТ МЕСЯЦ',
      all: 'АБСОЛЮТНО ВСЮ'
    };

    const isConfirmed = window.confirm(
      `Ты уверен, что хочешь удалить ${periodNames[period]} статистику? Это нельзя отменить.`
    );

    if (!isConfirmed) return;

    setResettingPeriod(period);
    
    const result = await resetStats(period);
    
    if (result.success) {
      window.location.reload(); 
    } else {
      alert('Ошибка при удалении: ' + result.error);
      setResettingPeriod(null);
    }
  };

  return (
    <div className="mt-12 mb-8">
      {/* Кнопка-триггер (Осталась на месте в профиле) */}
      <button
        onClick={() => setIsOpen(true)}
        className="w-full flex items-center justify-between p-4 bg-[#16191E] border border-neutral-800 rounded-2xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-all"
      >
        <div className="flex items-center gap-3">
          <Settings size={18} />
          <span className="text-sm font-bold uppercase tracking-wider">Управление данными</span>
        </div>
      </button>

      {/* 
        ТЕМНЫЙ ФОН (Backdrop)
        Перекрывает всё (z-[998]) и закрывает шторку при клике 
      */}
      <div 
        onClick={() => setIsOpen(false)}
        className={`fixed inset-0 z-[998] bg-black/80 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* 
        ВЫЕЗЖАЮЩАЯ ШТОРКА (Bottom Sheet)
        z-[999] чтобы быть выше бегущей строки 
      */}
      <div 
        className={`fixed inset-x-0 bottom-0 z-[999] w-full max-w-md mx-auto bg-[#0D0F12] border-t border-red-900/50 rounded-t-3xl transition-transform duration-300 ease-out transform ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        {/* Декоративный "ползунок" для имитации свайпа вниз */}
        <div className="w-full flex justify-center pt-3 pb-1" onClick={() => setIsOpen(false)}>
          <div className="w-12 h-1.5 bg-neutral-800 rounded-full"></div>
        </div>

        <div className="p-6 pb-10">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-white text-lg font-bold flex items-center gap-2">
              <AlertTriangle className="text-red-500" size={20} />
              Опасная зона
            </h3>
            <button 
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-neutral-800 text-neutral-400 hover:text-white"
            >
              <X size={18} />
            </button>
          </div>

          <p className="text-neutral-500 text-xs mb-6">
            Эти действия навсегда удалят твои логи за выбранный период. Настройки профиля сохранятся.
          </p>

          <div className="p-5 border border-red-900/30 bg-red-950/10 rounded-2xl relative overflow-hidden">
            {/* Градиентная линия сверху красного блока */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500/0 via-red-500/50 to-red-500/0"></div>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <button
                onClick={() => handleReset('today')}
                disabled={resettingPeriod !== null}
                className="py-4 flex items-center justify-center rounded-xl border border-red-500/20 text-red-400 uppercase tracking-wider text-[10px] font-bold bg-transparent hover:bg-red-500/10 active:bg-red-500/20 transition-colors disabled:opacity-30"
              >
                {resettingPeriod === 'today' ? 'Удаление...' : 'За сегодня'}
              </button>
              
              <button
                onClick={() => handleReset('week')}
                disabled={resettingPeriod !== null}
                className="py-4 flex items-center justify-center rounded-xl border border-red-500/20 text-red-400 uppercase tracking-wider text-[10px] font-bold bg-transparent hover:bg-red-500/10 active:bg-red-500/20 transition-colors disabled:opacity-30"
              >
                {resettingPeriod === 'week' ? 'Удаление...' : 'За 7 дней'}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleReset('month')}
                disabled={resettingPeriod !== null}
                className="py-4 flex items-center justify-center rounded-xl border border-red-500/20 text-red-400 uppercase tracking-wider text-[10px] font-bold bg-transparent hover:bg-red-500/10 active:bg-red-500/20 transition-colors disabled:opacity-30"
              >
                {resettingPeriod === 'month' ? 'Удаление...' : 'За месяц'}
              </button>
              
              <button
                onClick={() => handleReset('all')}
                disabled={resettingPeriod !== null}
                className="py-4 flex items-center justify-center rounded-xl border border-red-500/50 text-red-500 uppercase tracking-wider text-[10px] font-bold bg-red-500/5 hover:bg-red-500/20 active:bg-red-500/30 transition-colors disabled:opacity-30"
              >
                {resettingPeriod === 'all' ? 'Сжигаем...' : 'Всё время'}
              </button>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}