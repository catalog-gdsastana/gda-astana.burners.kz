'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../supabase';

export default function AdminPage() {
  const ADMIN_PASSWORD = 'MAF060704';

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [authError, setAuthError] = useState<string>('');

  const [products, setProducts] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [article, setArticle] = useState('');
  const [category, setCategory] = useState('gas');
  const [brand, setBrand] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchProducts();
    const savedAuth = localStorage.getItem('gds_admin_auth');
    if (savedAuth === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('id, title, article, category, brand, price, description');

    if (error) {
      console.error('Ошибка загрузки товаров в админке:', error.message);
    }
    if (data) {
      setProducts(data);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      localStorage.setItem('gds_admin_auth', 'true');
      setAuthError('');
      fetchProducts();
    } else {
      setAuthError('Неверный пароль!');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('gds_admin_auth');
  };

  const resetForm = () => {
    setEditingId(null);
    setTitle('');
    setArticle('');
    setCategory('gas');
    setBrand('');
    setPrice('');
    setDescription('');
  };

  const handleEdit = (prod: any) => {
    setEditingId(prod.id);
    setTitle(prod.title || '');
    setArticle(prod.article || '');
    setCategory(prod.category || 'gas');
    setBrand(prod.brand || '');
    setPrice(prod.price || '');
    setDescription(prod.description || '');

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Вы действительно хотите удалить товар "${title}"?`)) return;

    setLoading(true);
    const { error } = await supabase.from('products').delete().eq('id', id);
    setLoading(false);

    if (error) {
      setMessage(`Ошибка при удалении: ${error.message}`);
    } else {
      setMessage('🗑️ Товар успешно удален');
      fetchProducts();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    // Явно передаем null для колонок ссылок, чтобы Supabase не выдавал ошибку URL
    const productPayload = {
      title: title.trim(),
      article: article.trim() || null,
      category,
      price: price.trim() || null,
      description: description.trim() || null,
      brand: brand.trim() || null,
      image_url: null,
      pdf_url: null,
    };

    let error;

    if (editingId) {
      const res = await supabase.from('products').update(productPayload).eq('id', editingId);
      error = res.error;
    } else {
      const res = await supabase.from('products').insert([productPayload]);
      error = res.error;
    }

    setLoading(false);

    if (error) {
      console.error('Supabase error detail:', error);
      setMessage(`Ошибка: ${error.message}`);
    } else {
      setMessage(editingId ? '✅ Товар успешно обновлен!' : '✅ Товар успешно добавлен!');
      resetForm();
      fetchProducts();
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-4">
        <div className="bg-[#1E293B] rounded-3xl p-8 max-w-md w-full shadow-2xl border border-slate-700/50">
          <div className="text-center mb-6">
            <span className="text-4xl mb-2 block">🔒</span>
            <h1 className="text-2xl font-extrabold text-white">Вход в админ-панель</h1>
            <p className="text-xs text-slate-400 mt-1">ТОО «GDS Astana» — Управление каталогом</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Пароль администратора
              </label>
              <input 
                type="password" 
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Введите пароль..."
                className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-orange-500 placeholder-slate-500"
                autoFocus
              />
            </div>

            {authError && (
              <p className="text-xs text-red-400 font-medium text-center bg-red-950/40 py-2 border border-red-800/40 rounded-lg">
                {authError}
              </p>
            )}

            <button
              type="submit"
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl transition shadow-lg shadow-orange-500/20 active:scale-95"
            >
              Войти
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-100 p-6 md:p-12">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* ФОРМА ДОБАВЛЕНИЯ / РЕДАКТИРОВАНИЯ */}
        <div className="bg-[#1E293B] rounded-3xl p-8 shadow-xl border border-slate-700/50">
          <div className="flex justify-between items-center pb-6 mb-6 border-b border-slate-700/60">
            <div>
              <h1 className="text-2xl font-extrabold text-white">
                {editingId ? '✏️ Редактирование товара' : '➕ Добавление товара'}
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                {editingId ? `ID товара: ${editingId}` : 'Заполните параметры оборудования'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {editingId && (
                <button
                  onClick={resetForm}
                  className="bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-bold px-4 py-2 rounded-xl transition"
                >
                  Отмена
                </button>
              )}
              <button
                onClick={handleLogout}
                className="bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold px-4 py-2 rounded-xl transition flex items-center gap-1.5 border border-red-500/20"
              >
                <span>🚪</span> Выйти
              </button>
            </div>
          </div>

          {message && (
            <div className={`p-4 rounded-xl text-xs font-bold mb-6 border ${
              message.includes('Ошибка') 
                ? 'bg-red-950/40 text-red-400 border-red-800/40' 
                : 'bg-emerald-950/40 text-emerald-400 border-emerald-800/40'
            }`}>
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Название товара *</label>
                <input 
                  type="text" 
                  required 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Baltur BTG 15 P"
                  className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500 placeholder-slate-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Артикул</label>
                <input 
                  type="text" 
                  value={article} 
                  onChange={(e) => setArticle(e.target.value)}
                  placeholder="BTG-15-P"
                  className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500 placeholder-slate-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Категория</label>
                <select 
                  value={category} 
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500"
                >
                  <option value="gas">Газовые горелки</option>
                  <option value="diesel">Дизельные горелки</option>
                  <option value="combined">Комбинированные горелки</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Бренд</label>
                <input 
                  type="text" 
                  value={brand} 
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="Baltur, Riello, Rio..."
                  className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500 placeholder-slate-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Цена (₸)</label>
                <input 
                  type="text" 
                  value={price} 
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="450000"
                  className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500 placeholder-slate-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Описание</label>
              <textarea 
                rows={3}
                value={description} 
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Технические характеристики..."
                className="w-full bg-[#0F172A] border border-slate-700 rounded-xl p-4 text-sm text-white focus:outline-none focus:border-orange-500 placeholder-slate-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3.5 rounded-xl transition shadow-lg shadow-orange-500/20 active:scale-[0.99] disabled:opacity-50"
            >
              {loading ? 'Сохранение...' : editingId ? '💾 Сохранить изменения' : '➕ Добавить товар'}
            </button>
          </form>
        </div>

        {/* ТАБЛИЦА С ТОВАРАМИ */}
        <div className="bg-[#1E293B] rounded-3xl p-8 shadow-xl border border-slate-700/50">
          <h2 className="text-xl font-extrabold text-white mb-6">
            Все товары в базе ({products.length})
          </h2>

          {products.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-8">Товары пока не добавлены.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-700/60 text-[10px] text-slate-400 uppercase tracking-wider">
                    <th className="pb-3 px-2">Товар</th>
                    <th className="pb-3 px-2">Бренд</th>
                    <th className="pb-3 px-2">Категория</th>
                    <th className="pb-3 px-2">Цена</th>
                    <th className="pb-3 px-2 text-right">Действия</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/40 text-xs">
                  {products.map((prod) => (
                    <tr key={prod.id} className="hover:bg-slate-700/30 transition">
                      <td className="py-3 px-2 font-bold text-white">
                        {prod.title}
                        {prod.article && <span className="block text-[10px] font-normal text-slate-400">Арт: {prod.article}</span>}
                      </td>
                      <td className="py-3 px-2 text-slate-300 font-semibold">{prod.brand || '—'}</td>
                      <td className="py-3 px-2 text-slate-400 font-medium">{prod.category}</td>
                      <td className="py-3 px-2 font-bold text-orange-400">{prod.price ? `${prod.price} ₸` : 'По запросу'}</td>
                      <td className="py-3 px-2 text-right space-x-2">
                        <button
                          onClick={() => handleEdit(prod)}
                          className="bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 px-3 py-1.5 rounded-lg font-bold transition border border-orange-500/20"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDelete(prod.id, prod.title)}
                          className="bg-red-500/10 hover:bg-red-500/20 text-red-400 px-3 py-1.5 rounded-lg font-bold transition border border-red-500/20"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}