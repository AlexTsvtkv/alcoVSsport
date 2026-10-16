"use client";

import React, { useState } from 'react';
import { Dumbbell, Beer, Mail, LogIn } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

export default function Login() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  // Magic Link
  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Инициализируем клиент Supabase
    const supabase = createClient();

    // Отправляем запрос на Magic Link
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        // Указываем, куда вернуть пользователя после клика по ссылке из письма
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });



    setIsLoading(false);

    if (error) {
      if (error.status === 429) {
        alert('Слишком много попыток. Подожди пару минут.');
      } else {
        alert(error.message);
      }
      return;
    }

    setIsSent(true);
  };

  // СЕКРЕТНЫЙ ВХОД ДЛЯ РАЗРАБОТКИ
  const handleDevLogin = async () => {
    setIsLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: 'dev@test.com',
      password: '123456',
    });

    if (error) {
      alert('Ошибка Dev-входа: ' + error.message);
      setIsLoading(false);
    } else {
      // При успешном входе просто перезагружаем страницу, middleware сам пустит нас на главную
      window.location.href = '/'; 
    }
  };

  // Заглушка для Google Auth
  const handleGoogleLogin = () => {
    // Здесь будет вызов supabase.auth.signInWithOAuth({ provider: 'google' })
    console.log('Логин через Google');
  };

  return (
    <div className="text-white p-6 font-sans flex flex-col justify-center   relative overflow-hidden">
      
      {/* Декоративный фон */}
      <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-[#FF6B00] opacity-10 rounded-full blur-3xl mix-blend-screen" />
      <div className="absolute bottom-[-10%] right-[-10%] w-64 h-64 bg-[#00FF66] opacity-10 rounded-full blur-3xl mix-blend-screen" />

      <div className="relative z-10">
        <div className="flex justify-center items-center gap-4 mb-8">
          <Dumbbell size={48} className="text-[#00FF66]" />
          <span className="text-3xl text-neutral-600 font-black italic">VS</span>
          <Beer size={48} className="text-[#FF6B00]" />
        </div>

        <div className="text-center mb-10">
          <h1 className="text-3xl font-black tracking-tight mb-2">Баланс твоей жизни</h1>
          <p className="text-neutral-400 text-sm">Мы не боремся, мы совмещаем. Войди, чтобы начать вести хронику.</p>
        </div>

        {isSent ? (
          <div className="bg-[#16191E] border border-[#00FF66]/30 p-6 rounded-3xl text-center">
            <div className="w-16 h-16 bg-[#00FF66]/10 rounded-full flex items-center justify-center  mb-4">
              <Mail size={32} className="text-[#00FF66]" />
            </div>
            <h3 className="text-xl font-bold mb-2">Проверь почту</h3>
            <p className="text-neutral-400 text-sm mb-6">Мы отправили магическую ссылку на {email}. Нажми на нее, чтобы войти.</p>
            <button 
              onClick={() => setIsSent(false)}
              className="text-[#FF6B00] text-sm font-bold uppercase tracking-wider"
            >
              Ввести другой email
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <button 
              onClick={handleGoogleLogin}
              className="w-full bg-white hover:bg-neutral-200 text-black font-bold py-4 px-4 rounded-2xl flex items-center justify-center gap-3 transition-colors"
            >
              <LogIn size={20} />
              Продолжить через Google
            </button>

            <div className="flex items-center gap-4 py-4">
              <div className="flex-1 h-px bg-neutral-800" />
              <span className="text-neutral-500 text-xs font-bold uppercase tracking-widest">Или по почте</span>
              <div className="flex-1 h-px bg-neutral-800" />
            </div>

            <form onSubmit={handleMagicLink} className="space-y-3">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Твой email"
                className="w-full bg-[#16191E] border border-neutral-800 focus:border-neutral-500 rounded-2xl px-5 py-4 text-white outline-none transition-colors placeholder:text-neutral-600"
              />
              <button 
                type="submit"
                disabled={isLoading || !email}
                className="w-full bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 text-white font-bold py-4 px-4 rounded-2xl transition-colors"
              >
                {isLoading ? 'Отправляем...' : 'Получить ссылку'}
              </button>



              <button 
                type="button"
                onClick={handleDevLogin}
                className="w-full text-neutral-600 text-xs font-bold uppercase tracking-wider py-2 mt-4 hover:text-neutral-400 transition-colors"
              >
                [Dev] Вход в 1 клик
              </button>             
            </form>
          </div>
        )}
      </div>

    </div>
  );
}