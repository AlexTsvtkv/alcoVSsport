"use client";

import React, { useState, useMemo } from 'react';
import { Settings, Share, Beer, Dumbbell, BarChart2, UserPlus, Ghost, X, LogOut } from 'lucide-react';
import Link from 'next/link';
import { useTransition } from 'react'; // Добавим для состояния загрузки
import { toggleTickerTape, toggleGhostMode, postBroadcast } from '@/actions/social'; // Добавили toggleGhostMode
import { logOut } from '@/actions/auth';

// Вспомогательная функция для склонения слов
function getPlural(number: number, one: string, two: string, five: string) {
  let n = Math.abs(number);
  n %= 100;
  if (n >= 5 && n <= 20) {
    return five;
  }
  n %= 10;
  if (n === 1) {
    return one;
  }
  if (n >= 2 && n <= 4) {
    return two;
  }
  return five;
}

type Log = {
  type: string;
  intensity_level: number;
};

type Props = {
  initialLogs: Log[];
  email: string;
  userId: string;
  initialGhostMode: boolean;
  initialTickerVisible: boolean; // <--- ДОБАВЛЯЕМ СЮДА
};

export default function DashboardClient({ initialLogs, email, userId, initialGhostMode, initialTickerVisible }: Props) {
  const [viewMode, setViewMode] = useState<'quantity' | 'intensity'>('intensity');
  const [isSharing, startShareTransition] = useTransition();
  // Получаем начальное значение из пропсов (добавим его позже) или ставим true
  const [showSettings, setShowSettings] = useState(false);
  const [isGhostMode, setIsGhostMode] = useState(initialGhostMode); // Состояние инкогнито
  const [isTickerVisible, setIsTickerVisible] = useState(initialTickerVisible); // <--- ИСПОЛЬЗУЕМ ЗДЕСЬ

   // Извлекаем "никнейм" из email (все что до @)
  const username = email.split('@')[0];

const { ratio, sportCount, barCount, sportIntensity, barIntensity } = useMemo(() => {
    // Получаем сырое количество дней (для режима 'quantity')
    const sCount = initialLogs.filter(l => l.type === 'sport').length;
    const bCount = initialLogs.filter(l => l.type === 'drink').length;
    
    // Получаем сумму интенсивностей
    const sTotalIntensity = initialLogs.filter(l => l.type === 'sport').reduce((acc, curr) => acc + curr.intensity_level, 0);
    const bTotalIntensity = initialLogs.filter(l => l.type === 'drink').reduce((acc, curr) => acc + curr.intensity_level, 0);

    // Вычисляем среднюю интенсивность (сумма / количество дней). Если дней 0, то интенсивность 0.
    const sAvgIntensity = sCount > 0 ? sTotalIntensity / sCount : 0;
    const bAvgIntensity = bCount > 0 ? bTotalIntensity / bCount : 0;

    let sScore = 0; let bScore = 0;
    const BASE_SCORE = 5;

    // Считаем счет для баланса (весов) в зависимости от режима
    if (viewMode === 'quantity') {
      sScore = sCount;
      bScore = bCount;
    } else {
      sScore = sTotalIntensity;
      bScore = bTotalIntensity;
    }

    return {
      ratio: (sScore + BASE_SCORE) / (bScore + BASE_SCORE),
      sportCount: sCount,
      barCount: bCount,
      sportIntensity: sAvgIntensity, // Отдаем среднюю интенсивность спорта
      barIntensity: bAvgIntensity,   // Отдаем среднюю интенсивность бара
    };
  }, [initialLogs, viewMode]);

  const maxTilt = 15;
  const rawTilt = (1 - ratio) * 20; 
  const tiltAngle = Math.max(-maxTilt, Math.min(maxTilt, rawTilt));

  // Функция для динамичного статуса спорта
  const getSportVibe = (intensity: number) => {
    if (intensity === 0) return 'НЕТ ДАННЫХ';
    if (intensity < 1.5) return 'РАЗМИНКА';
    if (intensity < 2.5) return 'РАБОЧИЙ ПОТ';
    if (intensity < 3.5) return 'ЖЕСТКИЙ ПАМП';
    return 'РЕЖИМ ЗВЕРЯ';
  };

  // Функция для динамичного статуса алкоголя
  const getDrinkVibe = (intensity: number) => {
    if (intensity === 0) return 'НЕТ ДАННЫХ';
    if (intensity < 1.5) return 'ОДИН БОКАЛ';
    if (intensity < 2.5) return 'ЧИЛЛ';
    if (intensity < 3.5) return 'В ХЛАМ';
    return 'ВЫЖИВШИЙ';
  };

  // Формируем финальные лейблы для карточек
  const sportLabel = viewMode === 'quantity' 
    ? `${sportCount} ${getPlural(sportCount, 'ДЕНЬ', 'ДНЯ', 'ДНЕЙ')}` 
    : getSportVibe(sportIntensity); 

  const barLabel = viewMode === 'quantity' 
    ? `${barCount} ${getPlural(barCount, 'ДЕНЬ', 'ДНЯ', 'ДНЕЙ')}` 
    : getDrinkVibe(barIntensity);
  //const sportLabel = viewMode === 'quantity' ? `${sportCount} ДНЕЙ` : sportCount > 0 ? 'РАБОЧИЙ ПОТ' : 'НЕТ ДАННЫХ';
  //const barLabel = viewMode === 'quantity' ? `${barCount} ДНЯ` : barCount > 0 ? 'В ХЛАМ' : 'НЕТ ДАННЫХ';


const handleShare = async () => {
    // 1. Определяем текст и тип для эфира
    let shareText = '';
    let broadcastType: 'sport' | 'bar' | 'neutral' = 'neutral';

    if (ratio > 1) {
      shareText = 'Спортивный акцент! 🥦🏋️‍♂️';
      broadcastType = 'sport';
    } else if (ratio < 1) {
      shareText = 'Уверенный уклон в гедонизм! 🍻🔥';
      broadcastType = 'bar';
    } else {
      shareText = 'Идеальный дзен и баланс! 🧘‍♂️⚖️';
      broadcastType = 'neutral';
    }

    // 2. Отправляем в бегущую строку (ЕСЛИ НЕ В РЕЖИМЕ ИНКОГНИТО)
    if (!isGhostMode) {
      startShareTransition(async () => {
        try {
          await postBroadcast(shareText, broadcastType);
        } catch (error) {
          console.error('Не удалось отправить в эфир', error);
        }
      });
    }

    // 3. Старая логика: нативный шэринг или копирование
    const shareData = {
      title: 'Мой баланс',
      text: `У меня ${shareText.toLowerCase()} А как посидели вы?`,
      url: window.location.origin,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log('Пользователь отменил шэринг');
      }
    } else {
      navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
      alert('Текст скопирован в буфер! И твой статус отправлен в эфир 📡'); 
    }
  };

  const handleInvite = () => {
    // Формируем ссылку на секретный маршрут
    const inviteLink = `${window.location.origin}/invite/${userId}`;
    navigator.clipboard.writeText(inviteLink);
    alert('Ссылка скопирована! Отправь её бро в Telegram 🤝');
  };

  return (
    <div className=" text-white p-4 font-sans flex flex-col justify-between  relative pb-8">
      
      {/* Шапка */}
      <div className="flex justify-between items-center mb-6 pt-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center font-bold text-xl">
            🍺
          </div>
          <span className="font-semibold text-neutral-300">@{username}</span>
        </div>
        <button onClick={() => setShowSettings(true)} className="text-neutral-400 hover:text-white transition-colors">
          <Settings size={24} />
        </button>
      </div>

      <div className=" border border-neutral-800 rounded-3xl p-6 shadow-2xl relative mb-4 flex-1 flex flex-col">
        
        {/* Обертка для центрирования */}
        <div className="w-full flex justify-center mb-6">
          
          {/* Сам переключатель */}
          <div className="flex bg-[#0D0F12] rounded-xl p-1 border border-neutral-800 w-full max-w-[320px]">
            
            <button 
              onClick={() => setViewMode('quantity')} 
              className={`flex-1 py-2 px-2 text-[11px] sm:text-xs font-black uppercase tracking-wider rounded-lg transition-all duration-200 flex justify-center items-center gap-1.5 ${
                viewMode === 'quantity' 
                  ? 'bg-[#16191E] text-white shadow-md border border-neutral-700' 
                  : 'text-neutral-500 hover:text-neutral-300'
              }`}
            >
              <span>⚖️</span> 
              <span className="whitespace-nowrap">По дням</span>
            </button>

            <button 
              onClick={() => setViewMode('intensity')} 
              className={`flex-1 py-2 px-2 text-[11px] sm:text-xs font-black uppercase tracking-wider rounded-lg transition-all duration-200 flex justify-center items-center gap-1.5 ${
                viewMode === 'intensity' 
                  ? 'bg-[#16191E] text-white shadow-md border border-neutral-700' 
                  : 'text-neutral-500 hover:text-neutral-300'
              }`}
            >
              <span>🔥</span> 
              <span className="whitespace-nowrap">Интенсив</span>
            </button>
            
          </div>
          
        </div>
        <div className="text-center mb-2">
          <div className="inline-block bg-neutral-800 text-neutral-300 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-3 border border-neutral-700">
            За этот месяц
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center justify-center gap-3">
             {ratio > 1 ? 'Спортивный акцент' : ratio < 1 ? 'Уклон в гедонизм' : 'Идеальный баланс'}
          </h1>
        </div>

        {/* Весы */}
        <div className="relative w-full flex-1 min-h-[160px] flex flex-col items-center justify-end pb-8 my-4">
          <div className="absolute bottom-4 w-4 h-16 bg-neutral-700 rounded-t-lg z-0" />
          <div className="absolute bottom-2 w-16 h-3 bg-neutral-800 rounded-full z-0" />
          
          <div className="w-64 h-2 bg-neutral-600 rounded-full relative transition-transform duration-700 ease-out z-10" style={{ transform: `rotate(${tiltAngle}deg)` }}>
            <div className="absolute left-1/2 -translate-x-1/2 -top-1.5 w-5 h-5 bg-neutral-400 rounded-full border-4 border-[#16191E]" />
            
            <div className="absolute -left-6 bottom-full flex flex-col items-center origin-bottom transition-transform duration-700" style={{ transform: `rotate(${-tiltAngle}deg)` }}>
              <div className="w-24 h-24 bg-[#00FF66]/10 border-2 border-[#00FF66] rounded-2xl flex flex-col items-center justify-center shadow-[0_0_15px_rgba(0,255,102,0.2)] mb-1 relative overflow-hidden">
                <Dumbbell size={40} color="#00FF66" strokeWidth={1.5} className="mb-1 relative z-10" />
                <span className="text-[10px] font-extrabold uppercase text-[#00FF66] tracking-wider relative z-10 text-center px-1">
                  {sportLabel}
                </span>
              </div>
              <div className="w-4 h-2 bg-neutral-500 rounded-t-sm" />
            </div>

            <div className="absolute -right-6 bottom-full flex flex-col items-center origin-bottom transition-transform duration-700" style={{ transform: `rotate(${-tiltAngle}deg)` }}>
              <div className="w-24 h-24 bg-[#FF6B00]/10 border-2 border-[#FF6B00] rounded-2xl flex flex-col items-center justify-center shadow-[0_0_15px_rgba(255,107,0,0.2)] mb-1 relative overflow-hidden">
                <Beer size={40} color="#FF6B00" strokeWidth={1.5} className="mb-1 relative z-10" />
                <span className="text-[10px] font-extrabold uppercase text-[#FF6B00] tracking-wider relative z-10 text-center px-1">
                  {barLabel}
                </span>
              </div>
              <div className="w-4 h-2 bg-neutral-500 rounded-t-sm" />
            </div>
          </div>
        </div>

        <div className="mt-4">
          <Link href="/profile" className="w-full bg-neutral-800/50 hover:bg-neutral-800 transition-colors border border-neutral-700/50 rounded-xl py-3 px-4 flex items-center justify-between text-neutral-300">
            <div className="flex items-center gap-2">
              <BarChart2 size={18} className="text-neutral-400" />
              <span className="text-sm font-semibold">Вся статистика</span>
            </div>
            <span className="text-neutral-500 text-xs font-bold uppercase tracking-wider">Открыть ›</span>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <Link href="/add/drink" className="bg-[#FF6B00] hover:bg-[#ff7b1a] transition-colors text-black font-black py-6 px-4 rounded-3xl shadow-lg flex flex-row items-center justify-center gap-2">
          <span className="text-3xl mt-[-4px]">+</span>
          <Beer size={32} strokeWidth={2.5} />
        </Link>
        <Link href="/add/sport" className="bg-[#00FF66] hover:bg-[#1aff75] transition-colors text-black font-black py-6 px-4 rounded-3xl shadow-lg flex flex-row items-center justify-center gap-2">
          <span className="text-3xl mt-[-4px]">+</span>
          <Dumbbell size={32} strokeWidth={2.5} />
        </Link>
      </div>

      {/* Две кнопки внизу: Поделиться и Инвайт */}
      <div className="flex gap-3 mt-2">
        <button 
          onClick={handleShare}
          disabled={isSharing}
          className={`flex-1 border border-neutral-800 transition-all font-bold py-4 px-2 rounded-2xl flex items-center justify-center gap-2 ${
            isSharing 
              ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed' 
              : 'bg-neutral-900 hover:border-neutral-700 hover:bg-neutral-800/50 text-white'
          }`}
        >
          <Share size={18} className={isSharing ? 'text-neutral-600' : 'text-neutral-400'} />
          <span className="text-sm sm:text-base">{isSharing ? 'Отправляем...' : 'Похвастаться'}</span>
        </button>

        <button 
          onClick={handleInvite}
          className="flex-1 bg-[#00FF66]/10 text-[#00FF66] border border-[#00FF66]/20 hover:bg-[#00FF66]/20 hover:border-[#00FF66]/40 transition-all font-bold py-4 px-2 rounded-2xl flex items-center justify-center gap-2"
        >
          <UserPlus size={18} />
          <span className="text-sm sm:text-base">Позвать бро</span>
        </button>
      </div>

      {/* Модальное окно настроек */}
      {showSettings && (
        <div className="absolute inset-0 z-50 bg-[#0D0F12]/80 backdrop-blur-sm flex items-end justify-center">
          <div className="bg-[#16191E] w-full border-t border-neutral-800 rounded-t-3xl p-6 pb-12 animate-in slide-in-from-bottom-10 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Настройки</h2>
              <button onClick={() => setShowSettings(false)} className="text-neutral-400 hover:text-white">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Тумблер 1: Бегущая строка */}
              <div className="flex items-center justify-between p-4 bg-neutral-800/50 rounded-2xl border border-neutral-700/50">
                <div>
                  <h3 className="font-bold text-white">Лента статусов</h3>
                  <p className="text-xs text-neutral-500">Показывать бегущую строку</p>
                </div>
                <button 
                  onClick={() => {
                    const newValue = !isTickerVisible;
                    setIsTickerVisible(newValue);
                    toggleTickerTape(newValue);
                  }}
                  className={`w-12 h-6 rounded-full transition-colors relative ${isTickerVisible ? 'bg-[#00FF66]' : 'bg-neutral-700'}`}
                >
                  <div className={`w-4 h-4 rounded-full bg-black absolute top-1 transition-transform ${isTickerVisible ? 'translate-x-7' : 'translate-x-1'}`} />
                </button>
              </div>
              
              {/* Тумблер 2: Режим Инкогнито */}
              <div className="flex items-center justify-between p-4 bg-neutral-800/50 rounded-2xl border border-neutral-700/50">
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <Ghost size={16} className={isGhostMode ? 'text-purple-400' : 'text-neutral-500'} />
                    <h3 className="font-bold text-white">Режим инкогнито</h3>
                  </div>
                  <p className="text-xs text-neutral-500 mt-1 max-w-[200px] leading-tight">
                    Ты видишь статусы, но твои никто не видит
                  </p>
                </div>
                <button 
                  onClick={() => {
                    const newValue = !isGhostMode;
                    setIsGhostMode(newValue);
                    toggleGhostMode(newValue);
                  }}
                  className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ${isGhostMode ? 'bg-purple-500' : 'bg-neutral-700'}`}
                >
                  <div className={`w-4 h-4 rounded-full bg-black absolute top-1 transition-transform ${isGhostMode ? 'translate-x-7' : 'translate-x-1'}`} />
                </button>
              </div>
              {/* Кнопка Выхода */}
              <button 
                onClick={() => logOut()}
                className="w-full flex items-center justify-center gap-2 p-4 mt-6 bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20 rounded-2xl transition-all font-bold"
              >
                <LogOut size={18} />
                Выйти из аккаунта
              </button>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
      
