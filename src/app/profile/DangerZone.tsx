"use client";

import { useState } from 'react';
import { resetStats, type ResetPeriod } from '@/actions/activities';
import { Settings, AlertTriangle, ChevronDown } from 'lucide-react';

export default function DangerZone() {
  const [isOpen, setIsOpen] = useState(false);
  const [resettingPeriod, setResettingPeriod] = useState<ResetPeriod | null>(null);

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
      {/* Кнопка-триггер (Спокойная, сливается с фоном) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-[#16191E] border border-neutral-800 rounded-2xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-all"
      >
        <div className="flex items-center gap-3">
          <Settings size={18} />
          <span className="text-sm font-bold uppercase tracking-wider">Управление данными</span>
        </div>
        <ChevronDown 
          size={18} 
          className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      {/* Выезжающая панель (CSS Grid хак для плавного раскрытия) */}
      <div 
        className={`grid transition-all duration-300 ease-in-out ${
          isOpen ? 'grid-rows-[1fr] opacity-100 mt-4' : 'grid-rows-[0fr] opacity-0 mt-0'
        }`}
      >
        <div className="overflow-hidden">
          <div className="p-5 border border-red-900/30 bg-red-950/10 rounded-2xl relative">
            
            {/* Декоративный элемент опасности */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500/0 via-red-500/50 to-red-500/0"></div>

            <div className="flex items-start gap-3 mb-4">
              <AlertTriangle size={18} className="text-red-500 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="text-red-500 text-xs uppercase tracking-widest font-bold">Опасная зона</h3>
                <p className="text-neutral-500 text-[10px] mt-1">Эти действия удалят твои логи навсегда. Настройки профиля сохранятся.</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2 mb-2">
              <button
                onClick={() => handleReset('today')}
                disabled={resettingPeriod !== null}
                className="py-3 flex items-center justify-center rounded-lg border border-red-500/20 text-red-400 uppercase tracking-wider text-[10px] font-bold bg-transparent hover:bg-red-500/10 active:bg-red-500/20 transition-colors disabled:opacity-30"
              >
                {resettingPeriod === 'today' ? 'Удаление...' : 'За сегодня'}
              </button>
              
              <button
                onClick={() => handleReset('week')}
                disabled={resettingPeriod !== null}
                className="py-3 flex items-center justify-center rounded-lg border border-red-500/20 text-red-400 uppercase tracking-wider text-[10px] font-bold bg-transparent hover:bg-red-500/10 active:bg-red-500/20 transition-colors disabled:opacity-30"
              >
                {resettingPeriod === 'week' ? 'Удаление...' : 'За 7 дней'}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleReset('month')}
                disabled={resettingPeriod !== null}
                className="py-3 flex items-center justify-center rounded-lg border border-red-500/20 text-red-400 uppercase tracking-wider text-[10px] font-bold bg-transparent hover:bg-red-500/10 active:bg-red-500/20 transition-colors disabled:opacity-30"
              >
                {resettingPeriod === 'month' ? 'Удаление...' : 'За месяц'}
              </button>
              
              <button
                onClick={() => handleReset('all')}
                disabled={resettingPeriod !== null}
                className="py-3 flex items-center justify-center rounded-lg border border-red-500/50 text-red-500 uppercase tracking-wider text-[10px] font-bold bg-red-500/5 hover:bg-red-500/20 active:bg-red-500/30 transition-colors disabled:opacity-30"
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