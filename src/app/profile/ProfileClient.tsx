"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Target, TrendingUp, Trophy, History, Trash2, Dumbbell, Beer, Calendar } from 'lucide-react';
import { deleteActivity, fetchActivitiesByDate, resetAllStats } from '@/actions/activities';
import { type ResetPeriod } from '@/actions/activities'; 



type Activity = {
  id: string;
  type: 'sport' | 'drink' | string;
  intensity_level: number;
  created_at: string;
};

const [isResetting, setIsResetting] = useState(false);
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
  
  const result = await resetAllStats(period);
  
  if (result.success) {
    window.location.reload(); // Перезагружаем, чтобы получить чистые данные
  } else {
    alert('Ошибка при удалении: ' + result.error);
    setResettingPeriod(null);
  }
};

// --- КОМПОНЕНТ ГРУППИРОВКИ И ТЕПЛОВОЙ ШКАЛЫ ---

// Вспомогательная функция, чтобы получить массив последних N дней
function getLastNDays(n: number) {
  const dates = [];
  const today = new Date();
  for (let i = 0; i < n; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    dates.push(d);
  }
  return dates.reverse(); // От старых к новым слева направо
}

function HeatmapStrip({ activities }: { activities: Activity[] }) {
  const days = getLastNDays(14); // Берем последние 14 дней

  return (
    <div className="flex gap-1.5 overflow-x-auto pb-4 pt-2 custom-scrollbar">
      {days.map((date, i) => {
        const dateStr = date.toDateString();
        
        // Ищем активности в этот конкретный день
        const dayLogs = activities.filter(
          a => new Date(a.created_at).toDateString() === dateStr
        );
        
        const hasSport = dayLogs.some(a => a.type === 'sport');
        const hasDrink = dayLogs.some(a => a.type === 'drink');
        
        // Определяем цвет квадратика
        let bgClass = "bg-neutral-800/50 border-neutral-800"; // Пусто
        if (hasSport && hasDrink) {
          bgClass = "bg-gradient-to-tr from-[#00FF66] to-[#FF6B00] border-transparent"; // Оба
        } else if (hasSport) {
          bgClass = "bg-[#00FF66] border-[#00FF66] shadow-[0_0_8px_rgba(0,255,102,0.4)]"; // Спорт
        } else if (hasDrink) {
          bgClass = "bg-[#FF6B00] border-[#FF6B00] shadow-[0_0_8px_rgba(255,107,0,0.4)]"; // Бар
        }

        const isToday = i === days.length - 1;

        return (
          <div key={dateStr} className="flex flex-col items-center gap-1 min-w-[28px]">
            <div className={`w-7 h-7 rounded-md border ${bgClass} transition-all`} />
            <span className={`text-[9px] font-bold ${isToday ? 'text-white' : 'text-neutral-600'}`}>
              {date.getDate()}
            </span>
          </div>
        );
      })}
    </div>
  );
}


// --- КОМПОНЕНТ ИСТОРИИ (С УДАЛЕНИЕМ И ГРУППИРОВКОЙ) ---
function HistoryList({ initialActivities }: { initialActivities: Activity[] }) {
  const [activities, setActivities] = useState(initialActivities);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  // Состояние для управления модальным окном календаря
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    setActivities((prev) => prev.filter((a) => a.id !== id));
    setDeletingId(id);

    try {
      await deleteActivity(id);
    } catch (error) {
      alert('Ошибка при удалении');
      setActivities(initialActivities); 
    } finally {
      setDeletingId(null);
    }
  };

  // ФУНКЦИЯ ГРУППИРОВКИ ЛОГОВ
  const groupedActivities = activities.reduce((groups, activity) => {
    const date = new Date(activity.created_at);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    let dateLabel = '';

    // Проверяем, "Сегодня" ли это
    if (date.toDateString() === today.toDateString()) {
      dateLabel = 'Сегодня';
    } 
    // Проверяем, "Вчера" ли это
    else if (date.toDateString() === yesterday.toDateString()) {
      dateLabel = 'Вчера';
    } 
    // Если старше, форматируем как "14 октября"
    else {
      dateLabel = date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
    }

    // Создаем массив для даты, если его еще нет, и пушим туда активность
    if (!groups[dateLabel]) {
      groups[dateLabel] = [];
    }
    groups[dateLabel].push(activity);

    return groups;
  }, {} as Record<string, Activity[]>);

  // ... (здесь будет return с версткой)

  
   if (activities.length === 0) {
    return <div className="text-neutral-500 text-center py-6 text-sm">История пуста.</div>;
  }

  return (
    <div className="mb-8 relative">
      {/* Заголовок и Кнопка вызова Календаря */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-neutral-400 text-xs uppercase tracking-widest font-bold flex items-center gap-2">
          <History size={14} /> Лента событий
        </h3>
        
        {/* Кнопка открытия модального окна */}
        <button 
          onClick={() => setShowCalendarModal(true)}
          className="flex items-center gap-2 text-xs font-bold bg-[#16191E] border border-neutral-700 hover:bg-neutral-800 text-neutral-300 py-1.5 px-3 rounded-lg transition-colors"
        >
          <Calendar size={14} className="text-[#00FF66]" />
          <span>Календарь</span>
        </button>
      </div>

      {/* Контейнер со скроллом */}
      <div className="max-h-[400px] overflow-y-auto pr-2 space-y-6 custom-scrollbar relative">
        
        {/* Рендерим сгруппированные логи */}
        {Object.entries(groupedActivities).map(([dateLabel, dayActivities]) => (
          <div key={dateLabel} className="space-y-3">
            
            {/* ЛИПКИЙ ЗАГОЛОВОК ДАТЫ */}
            <div className="sticky top-0 z-10 bg-[#0D0F12]/90 backdrop-blur-sm py-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-neutral-500 bg-neutral-900 px-3 py-1 rounded-full border border-neutral-800">
                {dateLabel}
              </span>
            </div>

            {/* Карточки активностей в этот день */}
            {dayActivities.map((activity) => (
              <div 
                key={activity.id} 
                className="flex items-center justify-between p-3 bg-[#16191E] border border-neutral-800 rounded-2xl"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    activity.type === 'sport' ? 'bg-[#00FF66]/10 text-[#00FF66]' : 'bg-[#FF6B00]/10 text-[#FF6B00]'
                  }`}>
                    {activity.type === 'sport' ? <Dumbbell size={18} /> : <Beer size={18} />}
                  </div>
                  
                  <div>
                    <div className="text-white text-sm font-bold">
                      {activity.type === 'sport' ? 'Тренировка' : 'Бар'} 
                      <span className="text-neutral-500 text-xs ml-2">уровень {activity.intensity_level}</span>
                    </div>
                    {/* Показываем только время, так как дата уже в заголовке */}
                    <div className="text-xs text-neutral-500 mt-0.5 font-mono">
                      {new Date(activity.created_at).toLocaleTimeString('ru-RU', { 
                        hour: '2-digit', minute: '2-digit' 
                      })}
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => handleDelete(activity.id)}
                  disabled={deletingId === activity.id}
                  className="p-2 text-neutral-600 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        ))}
      </div>
      {/* МОДАЛЬНОЕ ОКНО КАЛЕНДАРЯ */}
      {showCalendarModal && (
        <div className="fixed inset-0 z-50 bg-[#0D0F12]/80 backdrop-blur-sm flex items-center justify-center p-4">
          {/* Контейнер модалки */}
          <div className="bg-[#16191E] w-full max-w-sm border border-neutral-800 rounded-3xl p-6 shadow-[0_10px_40px_rgba(0,0,0,0.5)] animate-in fade-in zoom-in-95 duration-200">
            
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Calendar size={18} className="text-[#00FF66]" /> Пульс активности
              </h3>
              <button 
                onClick={() => setShowCalendarModal(false)}
                className="text-neutral-500 hover:text-white transition-colors p-1"
              >
                ✕
              </button>
            </div>

            {/* Легенда */}
            <div className="flex justify-center gap-4 mb-6 text-[10px] uppercase font-bold tracking-wider text-neutral-500">
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-sm bg-[#00FF66]"></div>Спорт</div>
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-sm bg-[#FF6B00]"></div>Бар</div>
            </div>

            {/* Сетка дней (последние 14 дней в виде плитки) */}
            <div className="grid grid-cols-7 gap-2">
              {getLastNDays(14).map((date, i) => {
                const dateStr = date.toDateString();
                const dayLogs = activities.filter(a => new Date(a.created_at).toDateString() === dateStr);
                
                const hasSport = dayLogs.some(a => a.type === 'sport');
                const hasDrink = dayLogs.some(a => a.type === 'drink');
                
                let bgClass = "bg-neutral-800/30 border-neutral-800/50 text-neutral-600"; 
                if (hasSport && hasDrink) {
                  bgClass = "bg-gradient-to-tr from-[#00FF66]/20 to-[#FF6B00]/20 border-neutral-600 text-white";
                } else if (hasSport) {
                  bgClass = "bg-[#00FF66]/10 border-[#00FF66]/50 text-[#00FF66]"; 
                } else if (hasDrink) {
                  bgClass = "bg-[#FF6B00]/10 border-[#FF6B00]/50 text-[#FF6B00]"; 
                }

                return (
                  <button 
                    key={dateStr}
                    onClick={() => {
                      // Логика перехода к дате (или фильтрации)
                      console.log('Выбрана дата:', dateStr);
                      setShowCalendarModal(false);
                    }}
                    className={`aspect-square rounded-xl border flex flex-col items-center justify-center transition-all hover:scale-105 ${bgClass}`}
                  >
                    <span className="text-[10px] font-medium leading-none mb-0.5">{date.toLocaleDateString('ru-RU', { weekday: 'short' })}</span>
                    <span className="text-sm font-black leading-none">{date.getDate()}</span>
                  </button>
                );
              })}
            </div>

            {/* --- НОВЫЙ БЛОК: ГЛУБОКИЙ АРХИВ --- */}
            <div className="mt-6 pt-6 border-t border-neutral-800 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-neutral-300 uppercase tracking-wider">Глубокий архив</div>
                <div className="text-[10px] text-neutral-500 mt-1">Поиск за любой год</div>
              </div>
              
              {/* Нативный календарь (стилизованный под киберпанк) */}
              <input 
                type="date" 
                onChange={async (e) => {
                  const selected = e.target.value;
                  if (!selected) return;
                  
                  // Закрываем модалку сразу для эффекта скорости
                  setShowCalendarModal(false);
                  
                  try {
                    // Запрашиваем данные с сервера
                    const oldLogs = await fetchActivitiesByDate(selected);
                    
                    if (oldLogs.length === 0) {
                      alert('В этот день событий не найдено 📭');
                      return;
                    }

                    // Магия "вклеивания" данных
                    setActivities(prev => {
                      // Защита от дубликатов (если дата уже есть в ленте)
                      const existingIds = new Set(prev.map(a => a.id));
                      const newLogs = oldLogs.filter(a => !existingIds.has(a.id));
                      
                      // Сливаем и сортируем по дате
                      const combined = [...prev, ...newLogs];
                      combined.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
                      return combined;
                    });
                    
                  } catch (error) {
                    console.error('Ошибка:', error);
                  }
                }}
                className="bg-[#0D0F12] border border-neutral-700 hover:border-neutral-500 text-white text-xs font-bold px-3 py-2 rounded-xl outline-none transition-colors cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-50 [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:hover:opacity-100"
              />
            </div>
            {/* --- КОНЕЦ НОВОГО БЛОКА --- */}

            <div className="mt-6 text-center text-xs text-neutral-500">
              Показаны последние 14 дней
            </div>
          </div>
        </div>
      )}
    </div>
  );

}

// --- ГЛАВНЫЙ КОМПОНЕНТ СТРАНИЦЫ ---
export default function ProfileClient({ initialActivities, username }: { initialActivities: Activity[], username: string }) {
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('week');
  const [viewMode, setViewMode] = useState<'quantity' | 'intensity'>('intensity');

  // Матрица данных (оставил твою)
  const statsData = {
    week: {
      index: 1.25, status: 'Спортивный акцент', color: 'text-[#00FF66]',
      quantity: { sportMain: '4', sportSub: 'тренировки', barMain: '2', barSub: 'тусовки' },
      intensity: { sportMain: 'Режим зверя', sportSub: 'Чаще всего', barMain: 'Нормально так', barSub: 'Чаще всего' }
    },
    month: {
      index: 0.67, status: 'Уклон в гедонизм', color: 'text-[#FF6B00]',
      quantity: { sportMain: '12', sportSub: 'тренировок', barMain: '15', barSub: 'дней в баре' },
      intensity: { sportMain: 'Рабочий пот', sportSub: 'Чаще всего', barMain: 'В хлам', barSub: 'Чаще всего' }
    },
    year: {
      index: 1.05, status: 'Идеальный баланс', color: 'text-neutral-300',
      quantity: { sportMain: '142', sportSub: 'тренировки', barMain: '138', barSub: 'тусовок' },
      intensity: { sportMain: 'Размял кости', sportSub: 'Чаще всего', barMain: 'Душа понеслась', barSub: 'Чаще всего' }
    }
  };

  const currentStats = statsData[period];
  const displayData = currentStats[viewMode];

  return (
    <div className="text-white p-4 font-sans flex flex-col relative pb-10">
      
      {/* Шапка */}
      <div className="flex items-center gap-4 mb-8 pt-2">
        <Link href="/" className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-400 hover:text-white transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-xl font-bold">Статистика</h1>
      </div>

      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 rounded-full bg-neutral-800 border-2 border-neutral-700 flex items-center justify-center font-bold text-3xl">
          🍺
        </div>
        <div>
          {/* ИСПОЛЬЗУЕМ РЕАЛЬНОЕ ИМЯ */}
          <h2 className="text-xl font-black">@{username}</h2>
          <p className="text-[#FF6B00] font-semibold text-xs uppercase tracking-wide mt-1">«ПЯТНИЧНЫЙ АТЛЕТ»</p>
        </div>
      </div>

      {/* ПАНЕЛЬ ФИЛЬТРОВ */}
      <div className="bg-[#16191E] p-2 rounded-2xl border border-neutral-800 mb-6">
        <div className="flex bg-[#0D0F12] rounded-xl p-1 mb-2">
          {(['week', 'month', 'year'] as const).map(p => (
            <button 
              key={p} onClick={() => setPeriod(p)}
              className={`flex-1 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-colors ${period === p ? 'bg-[#16191E] text-white border border-neutral-700' : 'text-neutral-500 hover:text-neutral-300'}`}
            >
              {p === 'week' ? 'Неделя' : p === 'month' ? 'Месяц' : 'Год'}
            </button>
          ))}
        </div>
        <div className="flex bg-[#0D0F12] rounded-xl p-1">
          <button 
            onClick={() => setViewMode('quantity')}
            className={`flex-1 py-2 text-[11px] font-black uppercase tracking-wider rounded-lg transition-colors flex justify-center items-center gap-1.5 ${viewMode === 'quantity' ? 'bg-[#16191E] text-white border border-neutral-700' : 'text-neutral-500 hover:text-neutral-300'}`}
          >
            <span>⚖️</span> Количество
          </button>
          <button 
            onClick={() => setViewMode('intensity')}
            className={`flex-1 py-2 text-[11px] font-black uppercase tracking-wider rounded-lg transition-colors flex justify-center items-center gap-1.5 ${viewMode === 'intensity' ? 'bg-[#16191E] text-white border border-neutral-700' : 'text-neutral-500 hover:text-neutral-300'}`}
          >
            <span>🔥</span> Вайб
          </button>
        </div>
      </div>

      {/* ОБЩИЙ ИНДЕКС */}
      <div className="bg-[#16191E] border border-neutral-800 rounded-3xl p-6 mb-6 flex flex-row items-center justify-between">
        <div>
          <p className="text-neutral-400 text-xs uppercase tracking-widest font-bold mb-1">Синтетический Индекс</p>
          <span className={`text-sm font-bold uppercase tracking-wider transition-colors ${currentStats.color}`}>
            {currentStats.status}
          </span>
        </div>
        <div className="text-4xl font-black transition-all">
          {currentStats.index.toFixed(2)}
        </div>
      </div>

      {/* СВОДКА */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        <div className="bg-[#16191E] border border-neutral-800 rounded-3xl p-5 flex flex-col justify-center min-h-[140px]">
          <div className="flex items-center gap-2 mb-3">
            <Target size={16} className="text-[#00FF66]" />
            <span className="text-neutral-400 text-xs font-bold uppercase tracking-wider">Спорт</span>
          </div>
          <div>
            <span className={`${viewMode === 'quantity' ? 'text-4xl font-black' : 'text-xl font-black leading-tight text-[#00FF66]'} block transition-all`}>
              {displayData.sportMain}
            </span> 
            <span className="text-xs text-neutral-500 block mt-1 uppercase font-bold transition-all">
              {displayData.sportSub}
            </span>
          </div>
        </div>
        <div className="bg-[#16191E] border border-neutral-800 rounded-3xl p-5 flex flex-col justify-center min-h-[140px]">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={16} className="text-[#FF6B00]" />
            <span className="text-neutral-400 text-xs font-bold uppercase tracking-wider">Бар</span>
          </div>
          <div>
            <span className={`${viewMode === 'quantity' ? 'text-4xl font-black' : 'text-xl font-black leading-tight text-[#FF6B00]'} block transition-all`}>
              {displayData.barMain}
            </span> 
            <span className="text-xs text-neutral-500 block mt-1 uppercase font-bold transition-all">
              {displayData.barSub}
            </span>
          </div>
        </div>
      </div>

      {/* ПЕРЕДАЕМ РЕАЛЬНЫЕ ДАННЫЕ В ИСТОРИЮ */}
      <HistoryList initialActivities={initialActivities} />

      {/* Ачивки */}
      <h3 className="text-neutral-400 text-xs uppercase tracking-widest font-bold mb-3">Достижения</h3>
      <div className="flex flex-col gap-3">
        <div className="bg-[#16191E] border border-neutral-800 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-yellow-500/10 flex items-center justify-center border border-yellow-500/20">
            <Trophy size={20} className="text-yellow-500" />
          </div>
          <div>
            <h4 className="font-bold text-sm">Спонсор пивзавода</h4>
            <p className="text-neutral-500 text-xs mt-1">Поддерживал уклон в гедонизм 3 недели</p>
          </div>
        </div>
      </div>

      <div className="mt-12 pt-6 border-t border-red-900/30">
  <h3 className="text-red-500/50 text-xs uppercase tracking-widest mb-4">Danger Zone: Сброс логов</h3>
  
  <div className="grid grid-cols-2 gap-2 mb-2">
    <button
      onClick={() => handleReset('today')}
      disabled={resettingPeriod !== null}
      className="py-3 rounded-lg border border-red-500/20 text-red-400 uppercase tracking-wider text-xs font-bold bg-transparent hover:bg-red-500/10 active:bg-red-500/20 transition-colors disabled:opacity-30"
    >
      {resettingPeriod === 'today' ? 'Удаление...' : 'За сегодня'}
    </button>
    
    <button
      onClick={() => handleReset('week')}
      disabled={resettingPeriod !== null}
      className="py-3 rounded-lg border border-red-500/20 text-red-400 uppercase tracking-wider text-xs font-bold bg-transparent hover:bg-red-500/10 active:bg-red-500/20 transition-colors disabled:opacity-30"
    >
      {resettingPeriod === 'week' ? 'Удаление...' : 'За 7 дней'}
    </button>
  </div>

      <div className="grid grid-cols-2 gap-2">
          <button
          onClick={() => handleReset('month')}
          disabled={resettingPeriod !== null}
          className="py-3 rounded-lg border border-red-500/20 text-red-400 uppercase tracking-wider text-xs font-bold bg-transparent hover:bg-red-500/10 active:bg-red-500/20 transition-colors disabled:opacity-30"
          >
            {resettingPeriod === 'month' ? 'Удаление...' : 'За месяц'}
          </button>
          
          <button
            onClick={() => handleReset('all')}
            disabled={resettingPeriod !== null}
            className="py-3 rounded-lg border border-red-500/50 text-red-500 uppercase tracking-wider text-xs font-bold bg-red-500/5 hover:bg-red-500/20 active:bg-red-500/30 transition-colors disabled:opacity-30"
          >
            {resettingPeriod === 'all' ? 'Сжигаем...' : 'Всё время'}
          </button>
        </div>
      </div>

    </div>
  );
}