import { createClient } from '@supabase/supabase-js';

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const rawAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!rawUrl) {
  throw new Error(
    'Переменная NEXT_PUBLIC_SUPABASE_URL не задана. Проверьте Environment Variables в Vercel.'
  );
}

if (!rawAnonKey) {
  throw new Error(
    'Переменная NEXT_PUBLIC_SUPABASE_ANON_KEY не задана. Проверьте Environment Variables в Vercel.'
  );
}

const supabaseUrl = rawUrl
  .trim()
  .replace(/^["']+|["']+$/g, '')
  .replace(/\/+$/, '');

const supabaseAnonKey = rawAnonKey
  .trim()
  .replace(/^["']+|["']+$/g, '');

if (!/^https:\/\/[a-zA-Z0-9-]+\.supabase\.co$/.test(supabaseUrl)) {
  throw new Error(
    `Неверный NEXT_PUBLIC_SUPABASE_URL: "${supabaseUrl}". ` +
    'Ожидается адрес вида https://xxxxxxxx.supabase.co'
  );
}

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
);