import { createClient } from '@supabase/supabase-js';

// Очищаем URL от слэшей на конце, кавычек и случайных пробелов
const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseUrl = rawUrl.trim().replace(/^["']|["']$/g, '').replace(/\/$/, '');

const supabaseAnonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim().replace(/^["']|["']$/g, '');

export const supabase = createClient(supabaseUrl, supabaseAnonKey);