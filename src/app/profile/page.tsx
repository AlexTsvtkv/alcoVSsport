import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import ProfileClient from './ProfileClient';

export default async function ProfilePage() {
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
    redirect('/login');
  }

  // ОГРАНИЧЕНИЕ: Берем логи только за последние 30 дней
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  // Запрашиваем ВСЕ логи пользователя, отсортированные от новых к старым
  const { data: activities } = await supabase
    .from('activities')
    .select('*')
    .eq('user_id', user.id)
    .gte('created_at', thirtyDaysAgo) // <--- Добавлен лимит
    .order('created_at', { ascending: false });

  // Достаем никнейм из почты
  const username = user.email?.split('@')[0] || 'warrior';

  return (
    <ProfileClient 
      initialActivities={activities || []} 
      username={username}
    />
  );
}