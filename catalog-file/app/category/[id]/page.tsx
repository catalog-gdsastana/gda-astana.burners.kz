'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
// Исправлен импорт supabase (используем алиакс @ или верный путь ../../app/supabase)
import { supabase } from '@/app/supabase';

// Укажите ваш номер WhatsApp
const WHATSAPP_NUMBER = '77000000000';

interface Product {
  id: string;
  title: string;
  description: string;
  article?: string;
  in_stock?: boolean;
  category: string;
  pdf_url?: string;
  price?: number | string;
  image_url?: string;
  images?: string[];
}

export default function CategoryPage({ params }: { params: Promise<{ id: string }> }) {
  // Разворачиваем параметры из Next.js 15+
  const resolvedParams = use(params);
  const categoryId = resolvedParams.id;

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const categoryTitles: Record<string, string> = {
    gas: 'Газовые горелки',
    diesel: 'Дизельные горелки',
    combined: 'Комбинированные горелки',
  };

  useEffect(() => {
    async function fetchCategoryProducts() {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .ilike('category', categoryId);

      if (data && !error) {
        setProducts(data);
      }
      setLoading(false);
    }

    fetchCategoryProducts();
  }, [categoryId]);

  const formatPrice = (price?: number | string) => {
    if (!price) return 'По запросу';
    if (typeof price === 'number') {
      return `${price.toLocaleString('ru-RU')} ₸`;
    }
    return price.includes('₸') ? price : `${price} ₸`;
  };

  const getProductImage = (prod: Product) => {
    if (prod.images && Array.isArray(prod.images) && prod.images.length > 0) {
      return prod.images[0];
    }
    return prod.image_url || null;
  };

  const getWhatsAppLink = (productTitle: string, article?: string) => {
    let message = `Здравствуйте! Меня интересует товар: "${productTitle}"`;
    if (article) {
      message += ` (Артикул: ${article})`;
    }
    message += `. Подскажите наличие и условия доставки?`;

    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-between p-6 md:p-12">
      <div className="max-w-6xl mx-auto w-full">
        
        {/* Кнопка "Назад" и заголовок */}
        <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <Link 
              href="/" 
              className="text-xs font-semibold text-blue-600 hover:underline mb-2 inline-block"
            >
              ← Вернуться на главную
            </Link>
            <h1 className="text-3xl font-extrabold text-gray-900">
              {categoryTitles[categoryId] || `Категория: ${categoryId}`}
            </h1>
          </div>

          <a 
            href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Здравствуйте! Нужна консультация.')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-medium text-xs transition shadow-sm flex items-center gap-2"
          >
            <span>💬</span>
            <span>Написать в WhatsApp</span>
          </a>
        </div>

        {/* Список товаров */}
        {loading ? (
          <div className="text-center py-20 text-gray-400 text-sm">
            Загрузка товаров...
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Четко указаны типы для prod (item) и index */}
            {products.map((prod: Product, index: number) => {
              const mainImage = getProductImage(prod);
              const totalImages = Array.isArray(prod.images) ? prod.images.length : (mainImage ? 1 : 0);

              return (
                <div 
                  key={prod.id || `category-prod-${index}`} 
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition overflow-hidden flex flex-col justify-between group"
                >
                  <div>
                    <div className="w-full h-48 bg-gray-100 relative overflow-hidden flex items-center justify-center border-b border-gray-50">
                      {mainImage ? (
                        <img 
                          src={mainImage} 
                          alt={prod.title}
                          className="w-full h-full object-contain p-4 group-hover:scale-105 transition duration-300"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-gray-300">
                          <span className="text-3xl mb-1">📷</span>
                          <span className="text-xs font-medium">Нет фото</span>
                        </div>
                      )}

                      {totalImages > 1 && (
                        <span className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm text-white text-[10px] font-semibold px-2 py-1 rounded-md">
                          📷 +{totalImages - 1}
                        </span>
                      )}
                    </div>

                    <div className="p-6">
                      <div className="flex justify-between items-start gap-2 mb-2">
                        <span className="text-xs text-blue-600 font-medium uppercase tracking-wider bg-blue-50 px-2.5 py-1 rounded-md">
                          {prod.category}
                        </span>
                        {prod.article && (
                          <span className="text-xs text-gray-400 font-mono">
                            Арт: {prod.article}
                          </span>
                        )}
                      </div>
                      <h4 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition">
                        {prod.title}
                      </h4>
                      <Link
                          href={`/product/${prod.id}`}
                          className="inline-flex items-center text-xs font-semibold text-blue-600 hover:text-blue-800 transition"
                        >
                          Подробнее о товаре →
                        </Link>
                      
                    </div>
                  </div>

                  <div className="px-6 pb-6 pt-4 border-t border-gray-100 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase tracking-wider">Цена</p>
                        <p className="text-base font-extrabold text-blue-600">
                          {formatPrice(prod.price)}
                        </p>
                      </div>
                    </div>

                    <a 
                      href={getWhatsAppLink(prod.title, prod.article)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs py-2.5 px-4 rounded-xl transition flex items-center justify-center gap-2 shadow-sm active:scale-[0.98]"
                    >
                      <span>💬</span>
                      <span>Связаться в WhatsApp</span>
                    </a>
                  </div>

                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 my-4">
  <span className="text-5xl mb-4 block">📦</span>

  <h3 className="text-lg font-bold text-gray-800 mb-2">
    В этой категории пока нет товаров
  </h3>

  <p className="text-gray-500 text-sm max-w-md mx-auto mb-6">
    Вы можете добавить новые товары через панель администратора.
  </p>

  <Link
    href="/admin"
    className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-6 py-3 rounded-xl transition"
  >
    Перейти в админку
  </Link>
</div>
        )}

      </div>
    </div>
  );
}   