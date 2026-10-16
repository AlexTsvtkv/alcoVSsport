import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function InvitePage({ params }: { params: { id: string } }) {
  const { id: inviterId } = params;

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

  // 1. Если не залогинен — на логин с сохранением ID инвайта
  if (!user) {
    redirect(`/login?inviteId=${inviterId}`);
  }

  // 2. Если кликнул на свою же ссылку — на главную
  if (user.id === inviterId) {
    redirect('/');
  }

  // 3. Проверяем, не друзья ли они уже
  const { data: existingConnection } = await supabase
    .from('connections')
    .select('id')
    .or(`and(user_id_1.eq.${inviterId},user_id_2.eq.${user.id}),and(user_id_1.eq.${user.id},user_id_2.eq.${inviterId})`)
    .single();

  if (existingConnection) {
    // Уже друзья, просто кидаем на главную
    redirect('/');
  }

  // 4. Получаем email пригласившего (чтобы показать, кто зовет)
  // Примечание: в реальном проекте лучше завести таблицу profiles с никнеймами. 
  // Но для MVP мы можем вытащить email через админ-API или просто написать "Кто-то позвал тебя".
  // Пока оставим generic текст, чтобы не усложнять права доступа к auth.users.

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm bg-[#0D0F12] border border-neutral-900 rounded-3xl p-8 shadow-2xl text-center space-y-6">
        
        <div className="w-16 h-16 bg-[#00FF66]/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">🤝</span>
        </div>

        <div>
          <h1 className="text-2xl font-black text-white uppercase tracking-wider mb-2">Новый коннект</h1>
          <p className="text-neutral-400 text-sm">
            Тебя приглашают присоединиться к тусовке и шарить статусы.
          </p>
        </div>

        <div className="flex flex-col gap-3 pt-4">
          {/* Форма для принятия инвайта */}
          <form action={async () => {
            'use server';
            const cookieStore = await cookies();
            const supabase = createServerClient(
              process.env.NEXT_PUBLIC_SUPABASE_URL!,
              process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
              {
                cookies: { getAll() { return cookieStore.getAll(); }, setAll() {} },
              }
            );
            
            await supabase.from('connections').insert([
              { user_id_1: inviterId, user_id_2: user.id }
            ]);
            
            redirect('/');
          }}>
            <button 
              type="submit"
              className="w-full bg-[#00FF66] text-black font-bold py-4 rounded-xl hover:bg-[#00cc52] transition-colors"
            >
              Принять вызов
            </button>
          </form>

          {/* Кнопка отказа (просто уходим на главную) */}
          <Link 
            href="/"
            className="w-full bg-neutral-900 text-neutral-400 font-bold py-4 rounded-xl hover:bg-neutral-800 hover:text-white transition-colors"
          >
            Скрыться (Отклонить)
          </Link>
        </div>

      </div>
    </div>
  );
}