import React from 'react';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import DashboardClient from './DashboardClient';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const cookieStore = await cookies();
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {},
      },
    }
  );

  // Получаем юзера
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect('/login');
  }

  // Получаем логи ТОЛЬКО за текущий месяц
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];

  const { data: logs, error } = await supabase
    .from('activities')
    .select('type, intensity_level')
    .eq('user_id', user.id)
    .gte('event_date', firstDayOfMonth); // Больше или равно 1-му числу

  if (error) {
    console.error('Ошибка загрузки логов:', error);
  }

  // Передаем реальные данные (или пустой массив) в клиентский компонент
  //return <DashboardClient initialLogs={logs || []} email={user.email || ''} />;

  // Читаем настройки из кук
  const isGhostMode = cookieStore.get('ghost_mode')?.value === 'true';
  const showTicker = cookieStore.get('show_ticker')?.value !== 'false'; // по умолчанию true

  // Передаем реальные данные в клиентский компонент (добавили userId и isGhostMode)
  return (
    <DashboardClient 
      initialLogs={logs || []} 
      email={user.email || ''} 
      userId={user.id}
      initialGhostMode={isGhostMode}
      initialTickerVisible={showTicker} // <--- ДОБАВЛЯЕМ ЭТО
    />
  );
}