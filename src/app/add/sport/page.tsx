"use client";

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
// Обрати внимание: мы больше не импортируем useRouter, так как редирект происходит на сервере
import { ArrowLeft, Dumbbell, Check, Loader2 } from 'lucide-react'; 
import { addLog } from '@/actions/logs';
import { useRouter } from 'next/navigation';

export default function AddSport() {
  const [selectedDay, setSelectedDay] = useState<'today' | 'yesterday' | 'week'>('today');
  // У нас интенсивность теперь должна быть числом (1-4) для базы
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
  
  // Хук для отображения состояния загрузки (когда данные отправляются на сервер)
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleLog = () => {
    if (!selectedLevel || isPending) return;
    
    // Запускаем Server Action через transition
    startTransition(async () => {
      try {
        await addLog('sport', selectedLevel, selectedDay);
        router.push('/');
      } catch (error) {
        alert('Упс, что-то пошло не так. Попробуй еще раз.');
      }
    });
  };

  const levels = [
    { id: 1, title: 'Размял кости', desc: 'Лайт / Зарядка', isExtreme: false },
    { id: 2, title: 'Рабочий пот', desc: 'Обычная треня', isExtreme: false },
    { id: 3, title: 'Режим зверя', desc: 'Интенсив', isExtreme: false },
    { id: 4, title: 'Выплюнул легкие', desc: 'Хардкор', isExtreme: true },
  ];

  // ... дальше идет весь твой код с return (версткой) ...
  // Единственное изменение - в кнопке "Зафиксировать вайб" поменяй текст во время загрузки:
  
  /*
  <button 
    onClick={handleLog}
    disabled={!selectedLevel || isPending}
    ...
  >
    {isPending ? (
      <span className="flex items-center justify-center gap-2">
        <Loader2 className="animate-spin" size={20} /> Записываем...
      </span>
    ) : (
      'Зафиксировать вайб'
    )}
  </button>
  */

  return (
    <div className=" text-white p-4 font-sans flex flex-col">
      
      <div className="flex items-center gap-4 mb-8 pt-2">
        <Link href="/" className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-400 hover:text-white transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Dumbbell className="text-[#00FF66]" size={24} /> 
          Как потренировался?
        </h1>
      </div>

      <div className="mb-6">
        <h3 className="text-neutral-400 text-xs uppercase tracking-widest font-bold mb-3">Когда это было?</h3>
        <div className="flex bg-[#16191E] rounded-xl p-1 border border-neutral-800">
          {(['today', 'yesterday', 'week'] as const).map((day) => (
            <button 
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors ${selectedDay === day ? 'bg-[#00FF66] text-black shadow-md' : 'text-neutral-500 hover:text-neutral-300'}`}
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
                    ? 'bg-neutral-800/80 border-[#00FF66] shadow-[0_0_15px_rgba(0,255,102,0.15)]' 
                    : lvl.isExtreme 
                      ? 'bg-[#16191E] border-[#00FF66]/30 hover:border-[#00FF66]/50' 
                      : 'bg-[#16191E] border-neutral-800 hover:border-neutral-700'
                }`}
              >
                <div>
                  <span className={`font-bold text-lg block ${lvl.isExtreme && !isSelected ? 'text-[#00FF66]' : 'text-white'}`}>
                    {lvl.title}
                  </span>
                  <span className={`text-sm ${lvl.isExtreme && !isSelected ? 'text-[#00FF66]/70' : 'text-neutral-500'}`}>
                    {lvl.desc}
                  </span>
                </div>
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? 'border-[#00FF66] bg-[#00FF66]' : 'border-neutral-700'}`}>
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
          className={`w-full py-4 px-4 rounded-2xl font-black text-lg uppercase tracking-wide transition-all ${
            selectedLevel 
              ? 'bg-[#00FF66] hover:bg-[#1aff75] text-black shadow-[0_0_20px_rgba(0,255,102,0.3)] transform hover:scale-[1.02]' 
              : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
          }`}
         >
         {isPending ? (
         <span className="flex items-center justify-center gap-2">
           <Loader2 className="animate-spin" size={20} /> Записываем...
         </span>
         ) : (
               'Зафиксировать вайб'
             )}
  

        </button>
      </div>

    </div>
  );
}