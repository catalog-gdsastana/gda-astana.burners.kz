'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../supabase';
import {
  DEFAULT_CATALOG_CATEGORIES,
  DEFAULT_MAIN_CATEGORY_ID,
  DEFAULT_SUBGROUP_ID,
  getCategoryLabel,
  sortCatalogCategories,
  type CatalogCategory,
} from '../catalog';
import { sortManufacturers, type Manufacturer } from '../manufacturers';

interface AdminProduct {
  id: string;
  title: string;
  article?: string | null;
  category?: string | null;
  category_id?: string | null;
  manufacturer_id?: string | null;
  brand?: string | null;
  description?: string | null;
  image_url?: string | null;
  images?: string[] | null;
  videos?: string[] | null;
}

interface PendingMedia {
  id: string;
  file: File;
  previewUrl: string;
  kind: 'image' | 'video';
}

export default function AdminPage() {
  const ADMIN_PASSWORD = 'MAF060704';

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [authError, setAuthError] = useState<string>('');

  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [catalogCategories, setCatalogCategories] = useState<CatalogCategory[]>(
    DEFAULT_CATALOG_CATEGORIES
  );
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [newManufacturerName, setNewManufacturerName] = useState('');
  const [manufacturerMessage, setManufacturerMessage] = useState('');
  const [manufacturerLoading, setManufacturerLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [article, setArticle] = useState('');
  const [mainCategoryId, setMainCategoryId] = useState(DEFAULT_MAIN_CATEGORY_ID);
  const [categoryId, setCategoryId] = useState(DEFAULT_SUBGROUP_ID);
  const [brand, setBrand] = useState('');
  const [description, setDescription] = useState('');
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [existingVideos, setExistingVideos] = useState<string[]>([]);
  const [pendingMedia, setPendingMedia] = useState<PendingMedia[]>([]);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const fetchProducts = useCallback(async () => {
    const { data, error } = await supabase
      .from('products')
      .select('id, title, article, category, category_id, manufacturer_id, brand, description, image_url, images, videos');

    if (error) {
      console.error('Ошибка загрузки товаров в админке:', error.message);
    }
    if (data) {
      setProducts(data as AdminProduct[]);
    }
  }, []);

  const fetchManufacturers = useCallback(async () => {
    const { data, error } = await supabase
      .from('manufacturers')
      .select('id, name, is_active')
      .order('name');

    if (error) {
      console.error('Ошибка загрузки производителей:', error.message);
      return;
    }

    setManufacturers(sortManufacturers((data || []) as Manufacturer[]));
  }, []);

  const fetchCatalogCategories = useCallback(async () => {
    const { data, error } = await supabase
      .from('catalog_categories')
      .select('id, name, slug, parent_id, icon, sort_order, is_active')
      .eq('is_active', true)
      .order('sort_order');

    if (error || !data || data.length === 0) {
      console.error('Ошибка загрузки структуры каталога:', error?.message);
      setCatalogCategories(DEFAULT_CATALOG_CATEGORIES);
      return;
    }

    setCatalogCategories(sortCatalogCategories(data as CatalogCategory[]));
  }, []);

  useEffect(() => {
    const loadAdminData = async () => {
      await Promise.resolve();
      await Promise.all([fetchProducts(), fetchCatalogCategories(), fetchManufacturers()]);
      if (localStorage.getItem('gds_admin_auth') === 'true') {
        setIsAuthenticated(true);
      }
    };

    void loadAdminData();
  }, [fetchCatalogCategories, fetchManufacturers, fetchProducts]);

  const mainCategories = catalogCategories.filter((item) => item.parent_id === null);
  const availableSubgroups = catalogCategories.filter(
    (item) => item.parent_id === mainCategoryId
  );
  const activeManufacturers = manufacturers.filter((item) => item.is_active);
  const isBurnerSection = mainCategoryId === DEFAULT_MAIN_CATEGORY_ID;

  const handleMainCategoryChange = (nextMainCategoryId: string) => {
    setMainCategoryId(nextMainCategoryId);
    const firstSubgroup = catalogCategories.find(
      (item) => item.parent_id === nextMainCategoryId
    );
    setCategoryId(firstSubgroup?.id || '');
  };

  const handleAddManufacturer = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newManufacturerName.trim();
    if (!name) return;

    const existing = manufacturers.find(
      (item) => item.name.toLowerCase() === name.toLowerCase()
    );
    if (existing) {
      setManufacturerMessage('Этот производитель уже есть в списке.');
      setBrand(existing.name);
      return;
    }

    setManufacturerLoading(true);
    setManufacturerMessage('');
    const { data, error } = await supabase
      .from('manufacturers')
      .insert({ name })
      .select('id, name, is_active')
      .single();
    setManufacturerLoading(false);

    if (error) {
      setManufacturerMessage(`Ошибка: ${error.message}`);
      return;
    }

    setNewManufacturerName('');
    setBrand(data.name);
    setManufacturerMessage(`✅ Производитель «${data.name}» добавлен.`);
    await fetchManufacturers();
  };

  const handleToggleManufacturer = async (manufacturer: Manufacturer) => {
    setManufacturerLoading(true);
    setManufacturerMessage('');
    const { error } = await supabase
      .from('manufacturers')
      .update({ is_active: !manufacturer.is_active })
      .eq('id', manufacturer.id);
    setManufacturerLoading(false);

    if (error) {
      setManufacturerMessage(`Ошибка: ${error.message}`);
      return;
    }

    await fetchManufacturers();
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
    setMainCategoryId(DEFAULT_MAIN_CATEGORY_ID);
    setCategoryId(DEFAULT_SUBGROUP_ID);
    setBrand('');
    setDescription('');
    setExistingImages([]);
    setExistingVideos([]);
    setPendingMedia([]);
  };

  const handleEdit = (prod: AdminProduct) => {
    setEditingId(prod.id);
    setTitle(prod.title || '');
    setArticle(prod.article || '');
    const selectedSubgroup =
      catalogCategories.find((item) => item.id === prod.category_id) ||
      catalogCategories.find((item) => item.slug === prod.category) ||
      catalogCategories.find((item) => item.id === DEFAULT_SUBGROUP_ID);
    setMainCategoryId(selectedSubgroup?.parent_id || DEFAULT_MAIN_CATEGORY_ID);
    setCategoryId(selectedSubgroup?.id || DEFAULT_SUBGROUP_ID);
    setBrand(prod.brand || '');
    setDescription(prod.description || '');
    setExistingImages(
      prod.images && prod.images.length > 0
        ? prod.images
        : prod.image_url
          ? [prod.image_url]
          : []
    );
    setExistingVideos(prod.videos || []);
    setPendingMedia([]);

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

  const handleMediaSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length === 0) return;

    const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
    const allowedImageExtensions = ['jpg', 'jpeg', 'png', 'webp'];
    const allowedVideoExtensions = ['mp4', 'webm', 'mov'];
    let imageCount =
      existingImages.length + pendingMedia.filter((item) => item.kind === 'image').length;
    let videoCount =
      existingVideos.length + pendingMedia.filter((item) => item.kind === 'video').length;
    const nextMedia: PendingMedia[] = [];
    const errors: string[] = [];

    selectedFiles.forEach((file) => {
      const extension = file.name.split('.').pop()?.toLowerCase() || '';
      const isImage =
        allowedImageTypes.includes(file.type) || allowedImageExtensions.includes(extension);
      const isVideo =
        allowedVideoTypes.includes(file.type) || allowedVideoExtensions.includes(extension);

      if (!isImage && !isVideo) {
        errors.push(`«${file.name}»: неподдерживаемый формат`);
        return;
      }

      if (isImage && file.size > 5 * 1024 * 1024) {
        errors.push(`«${file.name}»: фотография больше 5 МБ`);
        return;
      }

      if (isVideo && file.size > 50 * 1024 * 1024) {
        errors.push(`«${file.name}»: видео больше 50 МБ`);
        return;
      }

      if (isImage && imageCount >= 10) {
        errors.push('Можно добавить не более 10 фотографий');
        return;
      }

      if (isVideo && videoCount >= 2) {
        errors.push('Можно добавить не более 2 видео');
        return;
      }

      if (isImage) imageCount += 1;
      if (isVideo) videoCount += 1;
      nextMedia.push({
        id: crypto.randomUUID(),
        file,
        previewUrl: URL.createObjectURL(file),
        kind: isImage ? 'image' : 'video',
      });
    });

    setPendingMedia((current) => [...current, ...nextMedia]);
    setMessage(errors.length > 0 ? `Ошибка: ${Array.from(new Set(errors)).join('. ')}` : '');
    e.target.value = '';
  };

  const uploadProductMedia = async () => {
    const uploadedImages = [...existingImages];
    const uploadedVideos = [...existingVideos];

    for (const media of pendingMedia) {
      const fallbackExtension = media.kind === 'image' ? 'jpg' : 'mp4';
      const extension = media.file.name.split('.').pop()?.toLowerCase() || fallbackExtension;
      const folder = media.kind === 'image' ? 'images' : 'videos';
      const filePath = `products/${folder}/${Date.now()}-${crypto.randomUUID()}.${extension}`;
      const fallbackContentTypes: Record<string, string> = {
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        png: 'image/png',
        webp: 'image/webp',
        mp4: 'video/mp4',
        webm: 'video/webm',
        mov: 'video/quicktime',
      };
      const { error } = await supabase.storage
        .from('product-images')
        .upload(filePath, media.file, {
          cacheControl: '3600',
          contentType: media.file.type || fallbackContentTypes[extension],
          upsert: false,
        });

      if (error) {
        throw new Error(`${media.file.name}: ${error.message}`);
      }

      const publicUrl = supabase.storage.from('product-images').getPublicUrl(filePath).data
        .publicUrl;
      if (media.kind === 'image') uploadedImages.push(publicUrl);
      else uploadedVideos.push(publicUrl);
    }

    return { uploadedImages, uploadedVideos };
  };

 const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const selectedSubgroup = catalogCategories.find((item) => item.id === categoryId);
    if (!selectedSubgroup || !selectedSubgroup.parent_id) {
      setLoading(false);
      setMessage('Ошибка: выберите подгруппу товара');
      return;
    }

    if (isBurnerSection && !brand.trim()) {
      setLoading(false);
      setMessage('Ошибка: для горелки укажите производителя');
      return;
    }

    let selectedManufacturer = manufacturers.find(
      (item) => item.name.toLowerCase() === brand.trim().toLowerCase()
    );

    if (brand.trim() && !selectedManufacturer) {
      const { data, error: manufacturerError } = await supabase
        .from('manufacturers')
        .insert({ name: brand.trim() })
        .select('id, name, is_active')
        .single();

      if (manufacturerError) {
        setLoading(false);
        setMessage(`Ошибка при добавлении производителя: ${manufacturerError.message}`);
        return;
      }

      selectedManufacturer = data as Manufacturer;
      await fetchManufacturers();
    }

    let uploadedMedia: { uploadedImages: string[]; uploadedVideos: string[] };
    try {
      uploadedMedia = await uploadProductMedia();
    } catch (uploadError) {
      setLoading(false);
      setMessage(
        `Ошибка при загрузке файлов: ${
          uploadError instanceof Error ? uploadError.message : 'неизвестная ошибка'
        }`
      );
      return;
    }

    const productPayload: Record<string, string | string[] | null> = {
      title: title.trim(),
      category: selectedSubgroup.slug,
      category_id: selectedSubgroup.id,
      manufacturer_id: selectedManufacturer?.id || null,
      brand: selectedManufacturer?.name || (brand.trim() || null),
      description: description.trim(),
      image_url: uploadedMedia.uploadedImages[0] || null,
      images: uploadedMedia.uploadedImages,
      videos: uploadedMedia.uploadedVideos,
    };

    if (article.trim()) productPayload.article = article.trim();
    
    let error;

    if (editingId) {
      const res = await supabase
        .from('products')
        .update(productPayload)
        .eq('id', editingId);
      error = res.error;
    } else {
      const res = await supabase
        .from('products')
        .insert([productPayload]);
      error = res.error;
    }

    setLoading(false);

    if (error) {
  console.log("FULL ERROR:", JSON.stringify(error, null, 2));
  console.error(error);

  setMessage(`Ошибка: ${error.message}`);
} else {
  setMessage(
    editingId
      ? "✅ Товар успешно обновлен!"
      : "✅ Товар успешно добавлен!"
  );

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

        {/* СПРАВОЧНИК ПРОИЗВОДИТЕЛЕЙ */}
        <div className="bg-[#1E293B] rounded-3xl p-8 shadow-xl border border-slate-700/50">
          <div className="mb-5">
            <h2 className="text-xl font-extrabold text-white">Производители</h2>
            <p className="text-xs text-slate-400 mt-1">
              Добавляйте новую фирму в любой момент. Она появится в каталоге после добавления товара.
            </p>
          </div>

          <form onSubmit={handleAddManufacturer} className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={newManufacturerName}
              onChange={(e) => setNewManufacturerName(e.target.value)}
              placeholder="Например: Riello"
              className="flex-1 bg-[#0F172A] border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500 placeholder-slate-500"
            />
            <button
              type="submit"
              disabled={manufacturerLoading || !newManufacturerName.trim()}
              className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-5 py-2.5 rounded-xl transition disabled:opacity-50"
            >
              + Добавить производителя
            </button>
          </form>

          {manufacturerMessage && (
            <p className={`mt-3 text-xs font-bold ${
              manufacturerMessage.includes('Ошибка') ? 'text-red-400' : 'text-emerald-400'
            }`}>
              {manufacturerMessage}
            </p>
          )}

          <div className="flex flex-wrap gap-2 mt-5">
            {manufacturers.length === 0 ? (
              <span className="text-xs text-slate-500">Производители пока не добавлены.</span>
            ) : (
              manufacturers.map((manufacturer) => (
                <button
                  key={manufacturer.id}
                  type="button"
                  disabled={manufacturerLoading}
                  onClick={() => handleToggleManufacturer(manufacturer)}
                  title={manufacturer.is_active ? 'Нажмите, чтобы скрыть' : 'Нажмите, чтобы вернуть'}
                  className={`text-xs font-bold px-3 py-2 rounded-xl border transition ${
                    manufacturer.is_active
                      ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                      : 'bg-slate-800 text-slate-500 border-slate-700 line-through'
                  }`}
                >
                  {manufacturer.name} · {manufacturer.is_active ? 'активен' : 'скрыт'}
                </button>
              ))
            )}
          </div>
        </div>
        
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Основной раздел *</label>
                <select 
                  required
                  value={mainCategoryId}
                  onChange={(e) => handleMainCategoryChange(e.target.value)}
                  className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500"
                >
                  {mainCategories.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                  {isBurnerSection ? 'Вид горелки *' : 'Подгруппа *'}
                </label>
                <select
                  required
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  disabled={availableSubgroups.length === 0}
                  className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500 disabled:opacity-50"
                >
                  {availableSubgroups.length === 0 && (
                    <option value="">Нет доступных подгрупп</option>
                  )}
                  {availableSubgroups.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                  Производитель {isBurnerSection ? '*' : ''}
                </label>
                <input 
                  type="text" 
                  list="manufacturer-options"
                  required={isBurnerSection}
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="Выберите или впишите новую фирму"
                  className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500 placeholder-slate-500"
                />
                <datalist id="manufacturer-options">
                  {activeManufacturers.map((manufacturer) => (
                    <option key={manufacturer.id} value={manufacturer.name} />
                  ))}
                </datalist>
                <p className="text-[10px] text-slate-500 mt-1">
                  Если фирмы нет в списке, просто впишите её название — она добавится автоматически.
                </p>
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

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-2">
                Фото и видео товара
              </label>
              <div className="rounded-2xl border border-dashed border-slate-600 bg-[#0F172A] p-4">
                <input
                  type="file"
                  multiple
                  accept=".jpg,.jpeg,.png,.webp,.mp4,.webm,.mov,image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime"
                  onChange={handleMediaSelect}
                  className="block w-full text-xs text-slate-300 file:mr-4 file:rounded-xl file:border-0 file:bg-orange-500 file:px-4 file:py-2.5 file:font-bold file:text-white hover:file:bg-orange-600"
                />
                <p className="mt-2 text-[10px] text-slate-500">
                  До 10 фото JPG/PNG/WebP по 5 МБ и до 2 видео MP4/WebM/MOV по 50 МБ.
                  Можно выбрать сразу несколько файлов.
                </p>

                {(existingImages.length > 0 || existingVideos.length > 0 || pendingMedia.length > 0) && (
                  <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {existingImages.map((url, index) => (
                      <div key={`existing-image-${url}`} className="relative h-36 overflow-hidden rounded-xl border border-slate-700 bg-slate-900 p-2">
                      <img
                          src={url}
                          alt={`Фотография ${index + 1}`}
                        className="h-full w-full object-contain"
                      />
                        <button
                          type="button"
                          onClick={() => setExistingImages((items) => items.filter((_, itemIndex) => itemIndex !== index))}
                          className="absolute right-2 top-2 h-7 w-7 rounded-full bg-red-600 text-xs font-bold text-white shadow-lg hover:bg-red-500"
                          aria-label={`Убрать фотографию ${index + 1}`}
                        >
                          ✕
                        </button>
                      </div>
                    ))}

                    {existingVideos.map((url, index) => (
                      <div key={`existing-video-${url}`} className="relative h-36 overflow-hidden rounded-xl border border-slate-700 bg-slate-900 p-2">
                        <video src={url} className="h-full w-full object-contain" controls preload="metadata" />
                        <button
                          type="button"
                          onClick={() => setExistingVideos((items) => items.filter((_, itemIndex) => itemIndex !== index))}
                          className="absolute right-2 top-2 h-7 w-7 rounded-full bg-red-600 text-xs font-bold text-white shadow-lg hover:bg-red-500"
                          aria-label={`Убрать видео ${index + 1}`}
                        >
                          ✕
                        </button>
                      </div>
                    ))}

                    {pendingMedia.map((media) => (
                      <div key={media.id} className="relative h-36 overflow-hidden rounded-xl border border-orange-500/40 bg-slate-900 p-2">
                        {media.kind === 'image' ? (
                          <img
                            src={media.previewUrl}
                            alt={media.file.name}
                            className="h-full w-full object-contain"
                          />
                        ) : (
                          <video
                            src={media.previewUrl}
                            className="h-full w-full object-contain"
                            controls
                            preload="metadata"
                          />
                        )}
                        <span className="absolute bottom-2 left-2 rounded bg-orange-500 px-2 py-1 text-[9px] font-bold text-white">
                          Новый файл
                        </span>
                        <button
                          type="button"
                          onClick={() => setPendingMedia((items) => items.filter((item) => item.id !== media.id))}
                          className="absolute right-2 top-2 h-7 w-7 rounded-full bg-red-600 text-xs font-bold text-white shadow-lg hover:bg-red-500"
                          aria-label={`Убрать файл ${media.file.name}`}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
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
                    <th className="pb-3 px-2">Фото</th>
                    <th className="pb-3 px-2">Товар</th>
                    <th className="pb-3 px-2">Бренд</th>
                    <th className="pb-3 px-2">Раздел</th>
                    <th className="pb-3 px-2">Подгруппа</th>
                    <th className="pb-3 px-2 text-right">Действия</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/40 text-xs">
                  {products.map((prod) => (
                    <tr key={prod.id} className="hover:bg-slate-700/30 transition">
                      <td className="py-3 px-2">
                        <div className="h-12 w-12 overflow-hidden rounded-lg border border-slate-700 bg-slate-900 flex items-center justify-center">
                          {prod.images?.[0] || prod.image_url ? (
                            <img
                              src={prod.images?.[0] || prod.image_url || ''}
                              alt={prod.title}
                              className="h-full w-full object-contain"
                            />
                          ) : prod.videos && prod.videos.length > 0 ? (
                            <span className="text-slate-400">🎬</span>
                          ) : (
                            <span className="text-slate-500">📷</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-2 font-bold text-white">
                        {prod.title}
                        {prod.article && <span className="block text-[10px] font-normal text-slate-400">Арт: {prod.article}</span>}
                      </td>
                      <td className="py-3 px-2 text-slate-300 font-semibold">{prod.brand || '—'}</td>
                      <td className="py-3 px-2 text-slate-400 font-medium">
                        {(() => {
                          const subgroup =
                            catalogCategories.find((item) => item.id === prod.category_id) ||
                            catalogCategories.find((item) => item.slug === prod.category);
                          return (
                            catalogCategories.find((item) => item.id === subgroup?.parent_id)?.name || '—'
                          );
                        })()}
                      </td>
                      <td className="py-3 px-2 text-slate-400 font-medium">
                        {getCategoryLabel(
                          catalogCategories,
                          prod.category_id || undefined,
                          prod.category || undefined
                        )}
                      </td>
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
