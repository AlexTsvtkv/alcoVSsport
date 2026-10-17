"use server";

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

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
        setAll() {}, // В Server Actions мы только читаем сессию
      },
    }
  );

  // Получаем текущего пользователя
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error('Пользователь не авторизован');
  }

  // Высчитываем реальную дату события с сохранением времени (чтобы логи не слипались в одну секунду)
  const eventDate = new Date();
  
  if (dayOffset === 'yesterday') {
    eventDate.setDate(eventDate.getDate() - 1);
  } else if (dayOffset === 'week') {
    // Делаем "позавчера" (минус 2 дня)
    eventDate.setDate(eventDate.getDate() - 2); 
  }

  // Вставляем данные в Supabase.
  // ВАЖНО: Записываем дату прямо в created_at в формате ISO, 
  // чтобы она переопределила дефолтное значение базы (now()).
  const { error } = await supabase.from('activities').insert({
    user_id: user.id,
    type: type,
    intensity_level: intensityLevel,
    created_at: eventDate.toISOString(), // Записываем точное время с учетом смещения дней
    // Если у тебя в базе есть обязательная колонка event_date, можешь оставить и её:
    // event_date: eventDate.toISOString().split('T')[0], 
  });

  if (error) {
    console.error('Ошибка записи:', error);
    throw new Error('Не удалось сохранить вайб');
  }

  // Принудительно обновляем кэш главной страницы и профиля
  revalidatePath('/');
  revalidatePath('/profile');
}