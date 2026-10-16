"use server";

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function addLog(
  type: 'sport' | 'drink',
  intensityLevel: number,
  dayOffset: 'today' | 'yesterday' | 'week'
) {
  const cookieStore = await cookies();
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {}, // В Server Actions мы только читаем сессию, обновлять не нужно
      },
    }
  );

  // Получаем текущего пользователя
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error('Пользователь не авторизован');
  }

  // Высчитываем реальную дату события в зависимости от выбора юзера
  const eventDate = new Date();
  if (dayOffset === 'yesterday') {
    eventDate.setDate(eventDate.getDate() - 1);
  } else if (dayOffset === 'week') {
    // Условно отнимаем 3 дня (или можно просто оставить текущую дату, 
    // если логика "на неделе" значит просто "в этом месяце")
    eventDate.setDate(eventDate.getDate() - 3); 
  }

  // Вставляем данные в Supabase
  const { error } = await supabase.from('activities').insert({
    user_id: user.id,
    type: type,
    intensity_level: intensityLevel,
    event_date: eventDate.toISOString().split('T')[0], // Формат YYYY-MM-DD
  });

  if (error) {
    console.error('Ошибка записи:', error);
    throw new Error('Не удалось сохранить вайб');
  }

  // Принудительно обновляем кэш главной страницы, чтобы новые данные сразу отобразились
  revalidatePath('/');
  revalidatePath('/profile');
  
  // Возвращаем юзера на главную
  //redirect('/');
}