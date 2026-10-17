import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // Инициализируем ответ, который будем модифицировать
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Важно: получаем текущего пользователя
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Определяем, пытается ли юзер зайти на страницу входа
  const isAuthPage = request.nextUrl.pathname.startsWith('/login');

  // Логика редиректов:
  if (!user && !isAuthPage) {
    // 1. Гость пытается зайти на любую защищенную страницу -> на логин
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  if (user && isAuthPage) {
    // 2. Авторизованный юзер пытается зайти на страницу логина -> на главную
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

// Указываем Next.js, на каких путях запускать middleware
export const config = {
  matcher: [
    /*
     * Исключаем системные файлы Next.js и статику (картинки, иконки),
     * чтобы middleware не тормозил загрузку стилей и картинок.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};