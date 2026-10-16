"use server";

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

// 1. Получаем ленту эфира
export async function getBroadcasts() {
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

  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return [];
  }

  // ПРАВИЛО 24 ЧАСОВ: Вычисляем время ровно 24 часа назад от ТЕКУЩЕЙ миллисекунды.
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  // Запрашиваем эфир.
  const { data: broadcasts, error } = await supabase
    .from('broadcasts')
    .select('*')
    .gte('created_at', twentyFourHoursAgo) // Строго больше, чем 24 часа назад
    .order('created_at', { ascending: false })
    .limit(15); // Увеличил до 15, чтобы лента была погуще

  if (error) {
    console.error('Ошибка загрузки эфира:', error);
    return [];
  }

  return broadcasts || [];
}

// 2. Отправляем статус в эфир
export async function postBroadcast(message: string, type: 'sport' | 'bar' | 'neutral') {
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

  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error('Не авторизован');
  }

  // Получаем никнейм из email
  const username = user.email?.split('@')[0] || 'юзер';
  // Формируем финальный текст
  const fullMessage = `@${username}: ${message}`;

  const { error } = await supabase
    .from('broadcasts')
    .insert({
      user_id: user.id,
      message: fullMessage,
      type: type,
    });

  if (error) {
    console.error('Ошибка публикации:', error);
    throw new Error('Не удалось похвастаться');
  }

  // Обновляем кэш, чтобы строка подхватила статус у того, кто отправил
  revalidatePath('/');
}

// Включаем / выключаем бегущую строку (сохраняем в куки)
export async function toggleTickerTape(show: boolean) {
  const cookieStore = await cookies();
  // Устанавливаем куки на год
  cookieStore.set('show_ticker', show ? 'true' : 'false', { maxAge: 60 * 60 * 24 * 365 });
  revalidatePath('/'); // Обновляем UI
}

// Режим Инкогнито (Скрытность)
export async function toggleGhostMode(isGhost: boolean) {
  const cookieStore = await cookies();
  
  // Запоминаем выбор пользователя
  cookieStore.set('ghost_mode', isGhost ? 'true' : 'false', { maxAge: 60 * 60 * 24 * 365 });
  
  // Если юзер включил скрытность — удаляем его текущие следы из эфира
  if (isGhost) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: { getAll() { return cookieStore.getAll(); }, setAll() {} },
      }
    );
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      await supabase
        .from('broadcasts')
        .delete()
        .eq('user_id', user.id);
    }
  }
  
  revalidatePath('/'); // Обновляем интерфейс
}