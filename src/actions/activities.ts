"use server";

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

export type ResetPeriod = 'all' | 'month' | 'week' | 'today';

export async function resetAllStats(period: ResetPeriod) {
  const cookieStore = await cookies();
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll() {},
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Не авторизован' };
  }

  // Базовый запрос на удаление (только для текущего юзера)
  let query = supabase.from('activities').delete().eq('user_id', user.id);

  // Вычисляем границы дат в формате YYYY-MM-DD
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  if (period === 'today') {
    // Только сегодняшние
    query = query.eq('event_date', todayStr);
  } else if (period === 'week') {
    // За последние 7 дней
    const weekAgo = new Date();
    weekAgo.setDate(now.getDate() - 7);
    query = query.gte('event_date', weekAgo.toISOString().split('T')[0]);
  } else if (period === 'month') {
    // С 1-го числа текущего месяца
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    query = query.gte('event_date', firstDayOfMonth.toISOString().split('T')[0]);
  }
  // Если period === 'all', ничего не добавляем, удаляется всё

  const { error } = await query;

  if (error) {
    console.error('Ошибка при сбросе:', error);
    return { success: false, error: error.message };
  }

  // Сбрасываем кэш
  revalidatePath('/');
  revalidatePath('/profile');
  
  return { success: true };
}

export async function deleteActivity(activityId: string) {
  const cookieStore = await cookies();
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: { getAll() { return cookieStore.getAll(); }, setAll() {} },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Не авторизован');
  }

  

  // Удаляем запись, строго проверяя совпадение ID юзера (защита от хакеров)
  const { error } = await supabase
    .from('activities')
    .delete()
    .eq('id', activityId)
    .eq('user_id', user.id);

  if (error) {
    console.error('Ошибка удаления:', error);
    throw new Error('Не удалось удалить запись');
  }

  

  // Обновляем кэш на главной и в профиле
  revalidatePath('/');
  revalidatePath('/profile');
}

export async function fetchActivitiesByDate(dateString: string) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll(); }, setAll() {} } }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Не авторизован');

  // Формируем начало и конец выбранного дня
  const startOfDay = new Date(dateString);
  const endOfDay = new Date(startOfDay);
  endOfDay.setDate(endOfDay.getDate() + 1);

  const { data, error } = await supabase
    .from('activities')
    .select('*')
    .eq('user_id', user.id)
    .gte('created_at', startOfDay.toISOString())
    .lt('created_at', endOfDay.toISOString())
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Ошибка загрузки архива:', error);
    return [];
  }

  return data || [];
}