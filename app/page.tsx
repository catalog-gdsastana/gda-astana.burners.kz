'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { supabase } from './supabase';
import { translations } from './translations';
import {
  DEFAULT_CATALOG_CATEGORIES,
  DEFAULT_MAIN_CATEGORY_ID,
  getCategoryLabel,
  sortCatalogCategories,
  type CatalogCategory,
} from './catalog';
import { sortManufacturers, type Manufacturer } from './manufacturers';
import { COMPANY_EMAIL, WHATSAPP_NUMBER } from './site-config';

interface Product {
  id: string;
  title: string;
  description: string;
  article?: string;
  brand?: string;         // 👈 Столбец для бренда из Supabase
  purpose?: string;       // Назначение (опционально)
  power_kw?: number;      // Мощность в кВт (опционально)
  in_stock?: boolean;
  category: string;
  category_id?: string;
  manufacturer_id?: string;
  pdf_url?: string;       // 👈 Ссылка на PDF документ
  image_url?: string;
  images?: string[];
}

interface EstimateItem {
  product: Product;
  quantity: number;
}

export default function Home() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [openCategory, setOpenCategory] = useState<string | null>(null);
  const [openManufacturer, setOpenManufacturer] = useState<string | null>(null);

  // 🌐 Язык интерфейса
  const [lang, setLang] = useState<'ru' | 'kz'>('ru');
  const t = translations[lang];

  const [products, setProducts] = useState<Product[]>([]);
  const [catalogCategories, setCatalogCategories] = useState<CatalogCategory[]>(
    DEFAULT_CATALOG_CATEGORIES
  );
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const currentYear = new Date().getFullYear();

  // ⚙️ Состояния для фильтрации
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [selectedMainCategory, setSelectedMainCategory] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [minPower, setMinPower] = useState<string>('');
  const [maxPower, setMaxPower] = useState<string>('');

  // Модалка товара
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);

  // Калькулятор
  const [calcMode, setCalcMode] = useState<'area' | 'power'>('area');
  const [inputValue, setInputValue] = useState<number | ''>(1500);

  // 🛒 Смета
  const [estimate, setEstimate] = useState<EstimateItem[]>([]);
  const [isEstimateOpen, setIsEstimateOpen] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerCity, setCustomerCity] = useState('');
  const [customerComment, setCustomerComment] = useState('');
  const [requestFormError, setRequestFormError] = useState('');

  useEffect(() => {
    async function fetchProducts() {
      const { data, error } = await supabase.from('products').select('*');
      if (data && !error) {
        setProducts(data);
      }
    }

    async function fetchCatalogCategories() {
      const { data, error } = await supabase
        .from('catalog_categories')
        .select('id, name, slug, parent_id, icon, sort_order, is_active')
        .eq('is_active', true)
        .order('sort_order');

      if (data && !error && data.length > 0) {
        setCatalogCategories(sortCatalogCategories(data as CatalogCategory[]));
      }
    }

    async function fetchManufacturers() {
      const { data, error } = await supabase
        .from('manufacturers')
        .select('id, name, is_active')
        .eq('is_active', true)
        .order('name');

      if (data && !error) {
        setManufacturers(sortManufacturers(data as Manufacturer[]));
      }
    }

    fetchProducts();
    fetchCatalogCategories();
    fetchManufacturers();
  }, []);

  // 🏷️ Динамически получаем только существующие в базе бренды
  const availableBrands = useMemo(() => {
    const brandsSet = new Set<string>();
    const activeManufacturerNames = new Set(
      manufacturers.map((item) => item.name.trim().toLowerCase())
    );
    products.forEach((p) => {
      if (
        p.brand &&
        p.brand.trim() !== '' &&
        (manufacturers.length === 0 || activeManufacturerNames.has(p.brand.trim().toLowerCase()))
      ) {
        brandsSet.add(p.brand.trim());
      }
    });
    return Array.from(brandsSet).sort((a, b) => a.localeCompare(b, 'ru'));
  }, [manufacturers, products]);

  const burnerBrands = useMemo(() => {
    return availableBrands.filter((brand) =>
      products.some((product) => {
        const subgroup =
          catalogCategories.find((item) => item.id === product.category_id) ||
          catalogCategories.find((item) => item.slug === product.category);
        return (
          subgroup?.parent_id === DEFAULT_MAIN_CATEGORY_ID &&
          product.brand?.trim().toLowerCase() === brand.toLowerCase()
        );
      })
    );
  }, [availableBrands, catalogCategories, products]);

  const mainCategories = useMemo(
    () => catalogCategories.filter((item) => item.parent_id === null),
    [catalogCategories]
  );

  const visibleSubgroups = useMemo(
    () =>
      catalogCategories.filter(
        (item) =>
          item.parent_id !== null &&
          (selectedMainCategory === 'all' || item.parent_id === selectedMainCategory)
      ),
    [catalogCategories, selectedMainCategory]
  );

  const getProductSubgroup = (product: Product) =>
    catalogCategories.find((item) => item.id === product.category_id) ||
    catalogCategories.find((item) => item.slug === product.category);

  const infoLinks = [
    { title: 'О компании', href: '#about', icon: '🏢' },
    { title: 'Статьи', href: '#articles', icon: '📝' },
    { title: 'Доставка и оплата', href: '#delivery', icon: '🚚' },
    { title: 'Контакты', href: '#contacts', icon: '📞' },
  ];

  const toggleCategory = (catId: string) => {
    setOpenCategory(openCategory === catId ? null : catId);
    setOpenManufacturer(null);
  };

  const toggleManufacturer = (name: string) => {
    setOpenManufacturer(openManufacturer === name ? null : name);
  };

  const handleMainCategoryFilter = (mainCategoryId: string) => {
    setSelectedMainCategory(mainCategoryId);
    setSelectedBrand('all');
    setSelectedCategory('all');
  };

  const getProductImages = (prod: Product): string[] => {
    if (prod.images && Array.isArray(prod.images) && prod.images.length > 0) {
      return prod.images;
    }
    return prod.image_url ? [prod.image_url] : [];
  };

  const getProductKey = (prod: Product) => prod.id || prod.article || prod.title;

  const addToEstimate = (prod: Product) => {
    setEstimate((prev) => {
      const prodKey = getProductKey(prod);
      const existing = prev.find((item) => getProductKey(item.product) === prodKey);
      if (existing) {
        return prev.map((item) =>
          getProductKey(item.product) === prodKey
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product: prod, quantity: 1 }];
    });
  };

  const removeFromEstimate = (prodKey: string) => {
    setEstimate((prev) => prev.filter((item) => getProductKey(item.product) !== prodKey));
  };

  const updateQuantity = (prodKey: string, delta: number) => {
    setEstimate((prev) =>
      prev
        .map((item) => {
          if (getProductKey(item.product) === prodKey) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as EstimateItem[]
    );
  };

  const isInEstimate = (prod: Product) => {
    const prodKey = getProductKey(prod);
    return estimate.some((item) => getProductKey(item.product) === prodKey);
  };

  const generateEstimateText = () => {
    let text = `Здравствуйте! Прошу рассчитать стоимость оборудования.\n\n`;
    text += `Имя: ${customerName.trim()}\n`;
    text += `Телефон: ${customerPhone.trim()}\n`;
    if (customerCity.trim()) text += `Город / объект: ${customerCity.trim()}\n`;
    if (customerComment.trim()) text += `Комментарий: ${customerComment.trim()}\n`;
    text += `\nОборудование:\n`;
    estimate.forEach((item, i) => {
      text += `${i + 1}. ${item.product.title}`;
      if (item.product.article) text += ` (Арт: ${item.product.article})`;
      text += ` — ${item.quantity} шт.`;
      text += `\n`;
    });
    text += `\nПрошу сообщить стоимость, срок поставки и подобрать оборудование при необходимости.`;
    return text;
  };

  const handleRequestLinkClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!customerName.trim() || !customerPhone.trim()) {
      e.preventDefault();
      setRequestFormError('Укажите имя и номер телефона.');
      return;
    }

    setRequestFormError('');
  };

  const getEstimateWhatsAppLink = () => {
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(generateEstimateText())}`;
  };

  const getEstimateEmailLink = () => {
    const subject = encodeURIComponent('Запрос сметы на оборудование');
    const body = encodeURIComponent(generateEstimateText());
    return `mailto:${COMPANY_EMAIL}?subject=${subject}&body=${body}`;
  };

  // Калькулятор
  const calculatedKw = Math.round(
    calcMode === 'area'
      ? (((Number(inputValue) || 0) * 100) / 1000) * 1.25
      : (Number(inputValue) || 0) * 1.25 // <--- Добавили умножение на 1.25 для мощности котла
  );
  const calculatedGcal = (calculatedKw * 0.00086).toFixed(2); // (небольшое примечание ниже)

  // 🔍 Фильтрация товаров (Поиск + Бренды + Категории + Мощность)
  const filteredProducts = useMemo(() => {
    return products.filter((prod) => {
      const productSubgroup =
        catalogCategories.find((item) => item.id === prod.category_id) ||
        catalogCategories.find((item) => item.slug === prod.category);
      const productMainCategory = productSubgroup?.parent_id;

      if (
        prod.brand &&
        manufacturers.length > 0 &&
        !manufacturers.some(
          (manufacturer) =>
            manufacturer.name.trim().toLowerCase() === prod.brand?.trim().toLowerCase()
        )
      ) {
        return false;
      }

      // Поиск по тексту
      const query = searchQuery.toLowerCase().trim();
      if (query) {
        const titleMatch = prod.title?.toLowerCase().includes(query);
        const articleMatch = prod.article?.toLowerCase().includes(query);
        const descriptionMatch = prod.description?.toLowerCase().includes(query);
        const categoryMatch =
          prod.category?.toLowerCase().includes(query) ||
          productSubgroup?.name.toLowerCase().includes(query) ||
          catalogCategories
            .find((item) => item.id === productMainCategory)
            ?.name.toLowerCase()
            .includes(query);
        if (!titleMatch && !articleMatch && !descriptionMatch && !categoryMatch) return false;
      }

      // Фильтр по Бренду
      if (selectedBrand !== 'all') {
        if (!prod.brand || prod.brand.trim().toLowerCase() !== selectedBrand.toLowerCase()) {
          return false;
        }
      }

      // Фильтр по основному разделу
      if (selectedMainCategory !== 'all' && productMainCategory !== selectedMainCategory) {
        return false;
      }

      // Фильтр по подгруппе
      if (selectedCategory !== 'all') {
        if (productSubgroup?.id !== selectedCategory) {
          return false;
        }
      }

      // Фильтр по Мощности (кВт)
      const pKw = Number(prod.power_kw) || 0;
      if (minPower && pKw < Number(minPower)) return false;
      if (maxPower && pKw > Number(maxPower)) return false;

      return true;
    });
  }, [
    products,
    catalogCategories,
    manufacturers,
    searchQuery,
    selectedBrand,
    selectedMainCategory,
    selectedCategory,
    minPower,
    maxPower,
  ]);

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedBrand('all');
    setSelectedMainCategory('all');
    setSelectedCategory('all');
    setMinPower('');
    setMaxPower('');
  };

  return (
    <div className="min-h-screen bg-slate-400 flex flex-col justify-between relative overflow-x-hidden">  
     
      {/* 1. БОКОВАЯ ШТОРКА (DRAWER) */}
      {isMenuOpen && (
        <div
          onClick={() => setIsMenuOpen(false)}
          className="fixed inset-0 bg-slate-900/60 z-40 backdrop-blur-sm transition-opacity"
        />
      )}

      <aside
        className={`fixed top-0 left-0 h-full w-80 bg-white z-50 shadow-2xl transform transition-transform duration-300 ease-in-out p-6 flex flex-col justify-between overflow-y-auto ${
          isMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          <div className="flex justify-between items-center pb-6 mb-6 border-b border-gray-100">
            <h2 className="text-xl font-bold text-slate-900">{t.menu}</h2>
            <button
              onClick={() => setIsMenuOpen(false)}
              className="p-2 rounded-xl text-gray-400 hover:text-slate-900 hover:bg-slate-100 transition"
            >
              ✕
            </button>
          </div>

          <nav className="flex flex-col gap-2">
            <div>
              <button
                onClick={() => setIsCatalogOpen(!isCatalogOpen)}
                className="w-full flex items-center justify-between px-4 py-3 text-slate-700 font-medium rounded-xl hover:bg-orange-50 hover:text-orange-600 transition"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">📦</span>
                  <span>{t.catalog}</span>
                </div>
                <span className={`text-xs transition-transform duration-200 ${isCatalogOpen ? 'rotate-180' : ''}`}>
                  ▼
                </span>
              </button>

              {isCatalogOpen && (
                <div className="pl-4 pr-1 py-2 flex flex-col gap-1 border-l-2 border-orange-500 ml-6 my-1">
                  {mainCategories.map((mainCategory) => {
                    const subgroups = catalogCategories.filter(
                      (item) => item.parent_id === mainCategory.id
                    );
                    const isCatOpen = openCategory === mainCategory.id;

                    return (
                      <div key={mainCategory.id}>
                        <button
                          onClick={() => toggleCategory(mainCategory.id)}
                          className="w-full flex items-center justify-between px-3 py-2 text-sm text-slate-700 font-medium rounded-lg hover:bg-orange-50 hover:text-orange-600 transition"
                        >
                          <div className="flex items-center gap-2">
                            <span>{mainCategory.icon || '📁'}</span>
                            <span>{mainCategory.name}</span>
                          </div>
                          <span className={`text-[10px] transition-transform ${isCatOpen ? 'rotate-180' : ''}`}>
                            ▼
                          </span>
                        </button>

                        {isCatOpen && (
                          <div className="pl-6 pr-1 py-1 flex flex-col gap-1 border-l border-gray-200 ml-4 my-1">
                            {mainCategory.id === DEFAULT_MAIN_CATEGORY_ID ? (
                              <>
                                {burnerBrands.map((brand) => {
                                  const isBrandOpen = openManufacturer === brand;
                                  const brandSubgroups = subgroups.filter((subgroup) =>
                                    products.some((product) => {
                                      const productSubgroup = getProductSubgroup(product);
                                      return (
                                        productSubgroup?.id === subgroup.id &&
                                        product.brand?.trim().toLowerCase() === brand.toLowerCase()
                                      );
                                    })
                                  );

                                  return (
                                    <div key={brand}>
                                      <button
                                        type="button"
                                        onClick={() => toggleManufacturer(brand)}
                                        className="w-full flex items-center justify-between text-xs text-slate-700 hover:text-orange-600 py-1.5 px-2 rounded hover:bg-orange-50 transition font-bold"
                                      >
                                        <span className="truncate">• {brand}</span>
                                        <span className={`text-[9px] transition-transform ${isBrandOpen ? 'rotate-180' : ''}`}>
                                          ▼
                                        </span>
                                      </button>

                                      {isBrandOpen && (
                                        <div className="ml-3 pl-3 border-l border-gray-200 flex flex-col">
                                          {brandSubgroups.map((subgroup) => {
                                            const count = products.filter((product) => {
                                              const productSubgroup = getProductSubgroup(product);
                                              return (
                                                productSubgroup?.id === subgroup.id &&
                                                product.brand?.trim().toLowerCase() === brand.toLowerCase()
                                              );
                                            }).length;

                                            return (
                                              <Link
                                                key={`${brand}-${subgroup.id}`}
                                                href={{
                                                  pathname: `/category/${subgroup.slug}`,
                                                  query: { brand },
                                                }}
                                                onClick={() => setIsMenuOpen(false)}
                                                className="text-[11px] text-slate-500 hover:text-orange-600 py-1.5 px-2 rounded hover:bg-orange-50 transition flex items-center justify-between gap-2"
                                              >
                                                <span className="truncate">{subgroup.name}</span>
                                                <span className="text-[9px] text-slate-400">{count}</span>
                                              </Link>
                                            );
                                          })}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}

                                <a
                                  href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Здравствуйте! Нужна горелка другого производителя. Помогите подобрать оборудование.')}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={() => setIsMenuOpen(false)}
                                  className="text-xs text-emerald-700 hover:text-emerald-800 py-2 px-2 rounded hover:bg-emerald-50 transition block font-bold"
                                >
                                  + Другой производитель — под заказ
                                </a>
                              </>
                            ) : subgroups.length > 0 ? (
                              subgroups.map((subgroup) => {
                                const subgroupProductCount = products.filter((product) => {
                                  const productSubgroup = getProductSubgroup(product);
                                  return productSubgroup?.id === subgroup.id;
                                }).length;

                                return (
                                <Link
                                  key={subgroup.id}
                                  href={`/category/${subgroup.slug}`}
                                  onClick={() => setIsMenuOpen(false)}
                                  className="text-xs text-slate-600 hover:text-orange-600 py-1.5 px-2 rounded hover:bg-orange-50 transition flex items-center justify-between gap-2 font-medium"
                                >
                                  <span className="truncate">• {subgroup.name}</span>
                                  <span className="text-[10px] text-slate-400">{subgroupProductCount}</span>
                                </Link>
                                );
                              })
                            ) : (
                              <span className="text-[11px] text-gray-400 py-1 italic pl-2">
                                Нет подгрупп
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {infoLinks.map((link) => (
              <Link
                key={link.title}
                href={link.href}
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 text-slate-700 font-medium rounded-xl hover:bg-orange-50 hover:text-orange-600 transition"
              >
                <span className="text-xl">{link.icon}</span>
                <span>{link.title}</span>
              </Link>
            ))}
          </nav>
        </div>

        <div className="pt-6 border-t border-gray-100 bg-slate-50 p-4 rounded-2xl mt-6">
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1">{t.salesDept}</p>
          <p className="text-sm font-bold text-slate-900">+7 (700) 000-00-00</p>
          <p className="text-xs text-gray-500 mt-1">Пн–Пт: 9:00 — 18:00</p>
        </div>
      </aside>

      {/* 2. ОСНОВНОЙ КОНТЕНТ */}
      <main className="p-6 md:p-12 max-w-6xl mx-auto w-full pb-28">
        
        {/* Шапка */}
        <header className="mb-8 border-b border-slate-200 pb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsMenuOpen(true)}
              className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2.5 rounded-xl text-slate-800 font-medium hover:bg-slate-50 hover:border-slate-300 transition shadow-sm"
            >
              <span className="text-lg">☰</span>
              <span>{t.menu}</span>
            </button>

            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">
                {t.catalog}
              </h1>
              <p className="text-slate-500 text-sm mt-0.5">
                {t.subtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* 🌐 ПЕРЕКЛЮЧАТЕЛЬ ЯЗЫКА */}
            <div className="flex items-center bg-slate-200/80 p-1 rounded-xl text-xs font-bold">
              <button
                onClick={() => setLang('ru')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  lang === 'ru' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                RU
              </button>
              <button
                onClick={() => setLang('kz')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  lang === 'kz' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                KZ
              </button>
            </div>

            {estimate.length > 0 && (
              <button
                onClick={() => setIsEstimateOpen(true)}
                className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2.5 rounded-xl font-bold text-xs transition shadow-sm flex items-center gap-2 animate-bounce"
              >
                <span>📋</span>
                <span>{t.estimate} ({estimate.reduce((acc, item) => acc + item.quantity, 0)})</span>
              </button>
            )}

            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Здравствуйте! Хочу проконсультироваться по оборудованию.')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-medium transition shadow-sm flex items-center gap-2 text-xs"
            >
              <span>💬</span>
              <span>WhatsApp</span>
            </a>
          </div>
        </header>

        {/* 🧮 КАЛЬКУЛЯТОР МОЩНОСТИ */}
        <div className="mb-8 bg-gradient-to-br from-slate-900 via-slate-800 to-zinc-900 text-white p-6 md:p-8 rounded-3xl shadow-xl border border-slate-700/50">
          <div className="flex items-center gap-3 mb-2">
            <span className="bg-orange-500/20 text-orange-400 text-xs font-bold px-3 py-1 rounded-full border border-orange-500/30">
              Быстрый подбор
            </span>
            <span className="text-gray-400 text-xs">Онлайн-калькулятор</span>
          </div>

          <h2 className="text-2xl font-extrabold mb-2">{t.calcTitle}</h2>
          <p className="text-gray-300 text-xs md:text-sm mb-6 max-w-2xl leading-relaxed">
            {t.calcSubtitle}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-white/5 p-6 rounded-2xl border border-white/10 backdrop-blur-sm">
            <div className="md:col-span-2 space-y-4">
              <div className="flex gap-2">
                <button
                  onClick={() => { setCalcMode('area'); setInputValue(1500); }}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition ${
                    calcMode === 'area' ? 'bg-orange-500 text-white shadow-md' : 'bg-white/10 text-gray-300 hover:bg-white/20'
                  }`}
                >
                  {t.calcAreaBtn}
                </button>
                <button
                  onClick={() => { setCalcMode('power'); setInputValue(250); }}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition ${
                    calcMode === 'power' ? 'bg-orange-500 text-white shadow-md' : 'bg-white/10 text-gray-300 hover:bg-white/20'
                  }`}
                >
                  {t.calcPowerBtn}
                </button>
              </div>

              <div>
                <input
                  type="number"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-lg font-bold text-white focus:outline-none focus:border-orange-500 transition placeholder-gray-500"
                />
              </div>
            </div>

            <div className="bg-white/10 p-5 rounded-xl border border-white/15 flex flex-col justify-between">
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-1">{t.recommendedPower}</p>
                <div className="text-3xl font-black text-orange-400">
                  ~{calculatedKw} <span className="text-lg font-normal text-white">кВт</span>
                </div>
                <p className="text-xs text-gray-300 mt-1">
                  или <strong className="text-white">{calculatedGcal}</strong> Гкал/час
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 🎛️ БЛОК ФИЛЬТРАЦИИ И ПОИСКА */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm mb-10 space-y-4">
          
          {/* Поисковая строка */}
          <div className="relative flex items-center">
            <span className="absolute left-4 text-gray-400 text-base">🔍</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="w-full bg-slate-50 border border-slate-200 pl-11 pr-10 py-3 rounded-xl text-xs font-medium text-slate-800 placeholder-gray-400 focus:outline-none focus:border-orange-500 transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 text-gray-400 hover:text-slate-600 text-xs font-bold bg-slate-200 w-5 h-5 rounded-full flex items-center justify-center"
              >
                ✕
              </button>
            )}
          </div>

          {/* Фильтры */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2 border-t border-slate-800">
            {/* БРЕНД (динамически из Supabase) */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                Производитель (Бренд)
              </label>
              <select
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-slate-100 text-xs font-bold rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Все бренды ({availableBrands.length})</option>
                {availableBrands.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>

            {/* ОСНОВНОЙ РАЗДЕЛ */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                Основной раздел
              </label>
              <select
                value={selectedMainCategory}
                onChange={(e) => handleMainCategoryFilter(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-slate-100 text-xs font-bold rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Все разделы</option>
                {mainCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* ПОДГРУППА */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                {selectedMainCategory === DEFAULT_MAIN_CATEGORY_ID ? 'Вид горелки' : 'Подгруппа'}
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-slate-100 text-xs font-bold rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">
                  {selectedMainCategory === DEFAULT_MAIN_CATEGORY_ID ? 'Все виды горелок' : 'Все подгруппы'}
                </option>
                {visibleSubgroups.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* ДИАПАЗОН МОЩНОСТИ */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                Мощность (кВт)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="От"
                  value={minPower}
                  onChange={(e) => setMinPower(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-slate-100 text-xs font-bold rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-500"
                />
                <span className="text-slate-500 font-bold">—</span>
                <input
                  type="number"
                  placeholder="До"
                  value={maxPower}
                  onChange={(e) => setMaxPower(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-slate-100 text-xs font-bold rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-500"
                />
              </div>
            </div>
          </div>

          {/* Кнопка сброса при активных фильтрах */}
          {(selectedBrand !== 'all' || selectedMainCategory !== 'all' || selectedCategory !== 'all' || minPower || maxPower || searchQuery) && (
            <div className="flex justify-end pt-2">
              <button
                onClick={resetFilters}
                className="text-xs text-red-400 font-bold hover:underline flex items-center gap-1"
              >
                <span>✕</span> Сбросить фильтры
              </button>
            </div>
          )}
        </div>

        {/* СПИСОК ТОВАРОВ */}
        <section id="catalog" className="mb-12">
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((prod, index) => {
                const productImages = getProductImages(prod);
                const mainImage = productImages[0] || null;
                const added = isInEstimate(prod);

                return (
                  <div key={prod.id || `product-${index}`} className="bg-slate-900 rounded-2xl border border-slate-800 shadow-lg hover:shadow-xl hover:border-slate-700 transition overflow-hidden flex flex-col justify-between group">
                    
                    <div className="cursor-pointer" onClick={() => { setSelectedProduct(prod); setActiveImageIndex(0); }}>
                      <div className="w-full h-48 bg-slate-800 relative overflow-hidden flex items-center justify-center border-b border-slate-700/50">
                        {mainImage ? (
                          <img
                            src={mainImage}
                            alt={prod.title}
                            className="w-full h-full object-contain p-4 group-hover:scale-105 transition duration-300"
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center text-slate-500">
                            <span className="text-3xl mb-1">📷</span>
                            <span className="text-xs font-medium">Нет фото</span>
                          </div>
                        )}

                        {prod.brand && (
                          <span className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-sm text-slate-200 text-[10px] font-extrabold px-2.5 py-1 rounded-lg border border-slate-700">
                            {prod.brand}
                          </span>
                        )}
                      </div>

                      <div className="p-6">
                        <div className="flex justify-between items-start gap-2 mb-2">
                          <span className="text-xs text-blue-400 font-medium uppercase tracking-wider bg-blue-950/60 border border-blue-800/50 px-2.5 py-1 rounded-md">
                            {getCategoryLabel(catalogCategories, prod.category_id, prod.category)}
                          </span>
                          {prod.article && (
                            <span className="text-xs text-slate-400 font-mono">
                              Арт: {prod.article}
                            </span>
                          )}
                        </div>

                        <h4 className="text-lg font-bold text-slate-100 mb-2 group-hover:text-blue-400 transition">
                          {prod.title}
                        </h4>

                        
                      </div>
                    </div>

                    <div className="px-6 pb-6 pt-4 border-t border-slate-800 flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[10px] text-slate-400 uppercase tracking-wider">Цена</p>
                          <p className="text-base font-extrabold text-blue-400">
                            {t.priceOnRequest}
                          </p>
                        </div>
                        <button
                          onClick={() => { setSelectedProduct(prod); setActiveImageIndex(0); }}
                          className="text-xs font-semibold text-slate-300 hover:text-blue-400 transition"
                        >
                          {t.details}
                        </button>
                      </div>

                      {/* ➕ КНОПКА ДОБАВЛЕНИЯ В СМЕТУ */}
                      <button
                        onClick={() => addToEstimate(prod)}
                        className={`w-full font-semibold text-xs py-2.5 px-4 rounded-xl transition flex items-center justify-center gap-2 ${
                          added
                            ? 'w-full bg-orange-500 hover:bg-orange-600 border border-blue-800'
                            : 'w-full bg-orange-500 hover:bg-orange-600 text-white shadow-md'
                        }`}
                      >
                        <span>{added ? t.inEstimate : t.addToEstimate}</span>
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16 bg-slate-900 rounded-3xl border border-slate-800">
              <p className="text-slate-400 font-bold text-sm"> По вашему запросу ничего не найдено.</p>
              <button
                onClick={resetFilters}
                className="mt-3 text-xs font-bold text-blue-400 hover:underline"
              >
                Сбросить фильтры
              </button>
            </div>
          )}
        </section>
      </main>

      {/* 📋 ПЛАВАЮЩИЙ БАР СМЕТЫ ВНИЗУ ЭКРАНА */}
      {estimate.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900/95 text-slate-100 px-6 py-4 rounded-2xl shadow-2xl z-40 flex items-center gap-6 border border-slate-800 max-w-md w-[90%] justify-between backdrop-blur-lg">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📝</span>
            <div>
              <p className="text-xs font-bold">{t.estimate}: {estimate.reduce((a, b) => a + b.quantity, 0)}</p>
              <p className="text-[10px] text-slate-400">Нажмите для просмотра</p>
            </div>
          </div>

          <button
            onClick={() => setIsEstimateOpen(true)}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs py-2.5 px-4 rounded-xl transition shadow-sm whitespace-nowrap"
          >
            {t.estimate} →
          </button>
        </div>
      )}

      {/* 📋 МОДАЛЬНОЕ ОКНО СМЕТЫ */}
      {isEstimateOpen && (
        <div
          className="fixed inset-0 bg-black/80 z-50 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setIsEstimateOpen(false)}
        >
          <div
            className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 md:p-8 shadow-2xl relative my-8 text-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsEstimateOpen(false)}
              className="absolute top-5 right-5 w-9 h-9 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-full flex items-center justify-center font-bold"
            >
              ✕
            </button>

            <h3 className="text-2xl font-extrabold text-slate-100 mb-2">
              {t.estimate} ({estimate.length})
            </h3>

            {estimate.length > 0 ? (
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1 mb-6">
                {estimate.map((item) => (
                  <div key={getProductKey(item.product)} className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between gap-4">
                    <div>
                      <h4 className="text-xs font-bold text-slate-100">{item.product.title}</h4>
                      <p className="text-xs font-extrabold text-blue-400 mt-1">
                        {t.priceOnRequest}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center bg-slate-900 border border-slate-700 rounded-xl overflow-hidden shadow-sm">
                        <button
                          onClick={() => updateQuantity(getProductKey(item.product), -1)}
                          className="px-2.5 py-1 text-xs font-bold hover:bg-slate-800 text-slate-200"
                        >
                          -
                        </button>
                        <span className="px-2 text-xs font-bold text-slate-100">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(getProductKey(item.product), 1)}
                          className="px-2.5 py-1 text-xs font-bold hover:bg-slate-800 text-slate-200"
                        >
                          +
                        </button>
                      </div>

                      <button
                        onClick={() => removeFromEstimate(getProductKey(item.product))}
                        className="text-red-400 hover:text-red-300 text-sm p-1"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 text-center py-8">Смета пока пуста.</p>
            )}

            <div className="border-t border-slate-800 pt-5">
              <h4 className="text-sm font-extrabold text-slate-100 mb-3">Ваши данные</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Имя *
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => {
                      setCustomerName(e.target.value);
                      setRequestFormError('');
                    }}
                    placeholder="Как к вам обращаться"
                    autoComplete="name"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-3 text-xs text-white outline-none focus:border-orange-500 placeholder:text-slate-600"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Телефон *
                  </label>
                  <input
                    type="tel"
                    inputMode="tel"
                    value={customerPhone}
                    onChange={(e) => {
                      setCustomerPhone(e.target.value);
                      setRequestFormError('');
                    }}
                    placeholder="+7 700 000 00 00"
                    autoComplete="tel"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-3 text-xs text-white outline-none focus:border-orange-500 placeholder:text-slate-600"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Город или объект
                  </label>
                  <input
                    type="text"
                    value={customerCity}
                    onChange={(e) => setCustomerCity(e.target.value)}
                    placeholder="Например: Шымкент, производственная котельная"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-3 text-xs text-white outline-none focus:border-orange-500 placeholder:text-slate-600"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Комментарий
                  </label>
                  <textarea
                    rows={3}
                    value={customerComment}
                    onChange={(e) => setCustomerComment(e.target.value)}
                    placeholder="Площадь объекта, мощность котла или дополнительная информация"
                    className="w-full resize-none rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-3 text-xs text-white outline-none focus:border-orange-500 placeholder:text-slate-600"
                  />
                </div>
              </div>

              {requestFormError && (
                <p className="mt-3 rounded-lg border border-red-800/50 bg-red-950/40 px-3 py-2 text-xs font-bold text-red-400">
                  {requestFormError}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4">
              <a
                href={getEstimateWhatsAppLink()}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleRequestLinkClick}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-3.5 px-4 rounded-xl transition flex items-center justify-center gap-2 shadow-md"
              >
                <span>💬</span>
                <span>WhatsApp</span>
              </a>

              <a
                href={getEstimateEmailLink()}
                onClick={handleRequestLinkClick}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs py-3.5 px-4 rounded-xl transition flex items-center justify-center gap-2 shadow-md"
              >
                <span>✉️</span>
                <span>Email</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* 👁️ МОДАЛЬНОЕ ОКНО ПОДРОБНОЙ ИНФОРМАЦИИ О ТОВАРЕ С PDF И ДЕТАЛЯМИ */}
      {selectedProduct && (
        <div
          className="fixed inset-0 bg-black/80 z-50 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setSelectedProduct(null)}
        >
          <div
            className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full p-6 md:p-8 shadow-2xl relative my-8 text-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedProduct(null)}
              className="absolute top-5 right-5 w-9 h-9 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-full flex items-center justify-center font-bold"
            >
              ✕
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="flex flex-col gap-3">
                <div className="w-full h-64 bg-slate-800 rounded-2xl overflow-hidden flex items-center justify-center border border-slate-700 p-4 relative">
                  {getProductImages(selectedProduct).length > 0 ? (
                    <img
                      src={getProductImages(selectedProduct)[activeImageIndex]}
                      alt={selectedProduct.title}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <span className="text-xs text-slate-400">Нет фото</span>
                  )}
                </div>
              </div>

              <div className="flex flex-col justify-between">
                <div>
                  {selectedProduct.brand && (
                    <span className="inline-block bg-blue-950 border border-blue-800 text-blue-300 text-xs font-black px-2.5 py-1 rounded-lg mb-2">
                      {selectedProduct.brand}
                    </span>
                  )}

                  {selectedProduct.article && (
                    <p className="text-xs text-slate-400 font-mono mb-1">
                      Артикул: {selectedProduct.article}
                    </p>
                  )}

                  <h3 className="text-2xl font-extrabold text-slate-100 mb-2">{selectedProduct.title}</h3>
                  <p className="text-xs text-slate-400 uppercase tracking-wider">Цена</p>
                  <p className="text-2xl font-black text-blue-400 mb-4">{t.priceOnRequest}</p>

                  {selectedProduct.power_kw && (
                    <div className="mb-4 p-3 bg-slate-800/80 rounded-xl text-xs space-y-1 text-slate-300 border border-slate-700">
                      <p><strong>Мощность:</strong> {selectedProduct.power_kw} кВт</p>
                    </div>
                  )}

                 
                </div>

                <div className="flex flex-col gap-3">
                  <Link
                  href={`/product/${selectedProduct.id}`}
                  onClick={() => setSelectedProduct(null)}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-3.5 px-4 rounded-xl transition flex items-center justify-center gap-2 shadow-md"
                >
                  <span>Подробнее о товаре</span>
                  <span>→</span>
                </Link>
                  {/* 📄 Кнопка скачивания PDF паспорта */}
                  {selectedProduct.pdf_url && (
                    <a
                      href={selectedProduct.pdf_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-bold py-3 px-4 rounded-xl transition flex items-center justify-center gap-2 border border-slate-700"
                    >
                      <span>📄</span>
                      <span>Скачать технический паспорт (PDF)</span>
                    </a>
                  )}

                  <button
                    onClick={() => {
                      addToEstimate(selectedProduct);
                      setSelectedProduct(null);
                      setIsEstimateOpen(true);
                    }}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs py-3.5 px-4 rounded-xl transition shadow-md"
                  >
                    {t.addToEstimate}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. ПОДВАЛ (FOOTER) */}
      <footer className="bg-slate-950 text-slate-100 pt-12 pb-8 border-t border-slate-800">
        <div className="max-w-6xl mx-auto px-6 text-xs text-slate-400 flex justify-between">
          <p>© 2020–{currentYear} ТОО «GDS Astana» — {t.catalog}</p>
        </div>
      </footer>

    </div>
  );
}
