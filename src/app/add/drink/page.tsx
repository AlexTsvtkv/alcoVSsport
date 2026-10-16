"use client";

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { ArrowLeft, Beer, Check, Loader2 } from 'lucide-react'; 
import { addLog } from '@/actions/logs';
import { useRouter } from 'next/navigation';

export default function AddDrink() {
  const [selectedDay, setSelectedDay] = useState<'today' | 'yesterday' | 'week'>('today');
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
  
  const [isPending, startTransition] = useTransition();
  const router = useRouter(); // <-- Добавляем роутер

  const handleLog = () => {
    if (!selectedLevel || isPending) return;
    
    startTransition(async () => {
      try {
        await addLog('drink', selectedLevel, selectedDay);
        // Как только данные успешно записались, переходим на главную
        router.push('/'); 
      } catch (error) {
        alert('Упс, что-то пошло не так. Попробуй еще раз.');
      }
    });
  };

  const levels = [
    { id: 1, title: 'Легкий вайб', desc: '1-2 бокала', isExtreme: false },
    { id: 2, title: 'Нормально так', desc: 'Уверенная тусовка', isExtreme: false },
    { id: 3, title: 'Душа понеслась', desc: 'Крепко', isExtreme: false },
    { id: 4, title: 'В хлам', desc: 'Отмена завтра', isExtreme: true },
  ];

  return (
    <div className=" text-white p-4 font-sans flex flex-col ">
      
      <div className="flex items-center gap-4 mb-8 pt-2">
        <Link href="/" className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-400 hover:text-white transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Beer className="text-[#FF6B00]" size={24} /> 
          Как посидели?
        </h1>
      </div>

      <div className="mb-6">
        <h3 className="text-neutral-400 text-xs uppercase tracking-widest font-bold mb-3">Когда это было?</h3>
        <div className="flex bg-[#16191E] rounded-xl p-1 border border-neutral-800">
          {(['today', 'yesterday', 'week'] as const).map((day) => (
            <button 
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors ${selectedDay === day ? 'bg-[#FF6B00] text-black shadow-md' : 'text-neutral-500 hover:text-neutral-300'}`}
            >
              {day === 'today' ? 'Сегодня' : day === 'yesterday' ? 'Вчера' : 'На неделе'}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1">
        <h3 className="text-neutral-400 text-xs uppercase tracking-widest font-bold mb-3">Интенсивность</h3>
        <div className="flex flex-col gap-3">
          {levels.map((lvl) => {
            const isSelected = selectedLevel === lvl.id;
            return (
              <button 
                key={lvl.id}
                onClick={() => setSelectedLevel(lvl.id)} 
                className={`p-5 rounded-2xl flex items-center justify-between text-left transition-all border ${
                  isSelected 
                    ? 'bg-neutral-800/80 border-[#FF6B00] shadow-[0_0_15px_rgba(255,107,0,0.15)]' 
                    : lvl.isExtreme 
                      ? 'bg-[#16191E] border-[#FF6B00]/30 hover:border-[#FF6B00]/50' 
                      : 'bg-[#16191E] border-neutral-800 hover:border-neutral-700'
                }`}
              >
                <div>
                  <span className={`font-bold text-lg block ${lvl.isExtreme && !isSelected ? 'text-[#FF6B00]' : 'text-white'}`}>
                    {lvl.title}
                  </span>
                  <span className={`text-sm ${lvl.isExtreme && !isSelected ? 'text-[#FF6B00]/70' : 'text-neutral-500'}`}>
                    {lvl.desc}
                  </span>
                </div>
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? 'border-[#FF6B00] bg-[#FF6B00]' : 'border-neutral-700'}`}>
                  {isSelected && <Check size={14} className="text-black" strokeWidth={3} />}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      <div className="mt-8 mb-4">
        <button 
          onClick={handleLog}
          disabled={!selectedLevel || isPending}
          className={`w-full py-4 px-4 rounded-2xl font-black text-lg uppercase tracking-wide transition-all flex items-center justify-center gap-2 ${
            selectedLevel 
              ? 'bg-[#FF6B00] hover:bg-[#ff7b1a] text-black shadow-[0_0_20px_rgba(255,107,0,0.3)] transform hover:scale-[1.02]' 
              : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
          }`}
        >
          {isPending ? (
            <>
              <Loader2 className="animate-spin" size={24} />
              Записываем...
            </>
          ) : (
            'Зафиксировать вайб'
          )}
        </button>
      </div>

    </div>
  );
}