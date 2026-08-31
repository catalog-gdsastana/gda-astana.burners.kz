import Link from 'next/link';
import { notFound } from 'next/navigation';
import { supabase } from '../../supabase';
import { COMPANY_EMAIL, WHATSAPP_NUMBER } from '../../site-config';
import ProductGallery from './product-gallery';

interface Product {
  id: string;
  title: string;
  description?: string;
  article?: string;
  brand?: string;
  purpose?: string;
  power_kw?: number;
  in_stock?: boolean;
  pdf_url?: string;
  image_url?: string;
  images?: unknown;
  videos?: unknown;
}

const getMediaUrls = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string' && item.trim() !== '')
    : [];

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error || !data) {
    notFound();
  }

  const product = data as Product;
  const images = getMediaUrls(product.images);
  if (images.length === 0 && product.image_url) {
    images.push(product.image_url);
  }
  const videos = getMediaUrls(product.videos);

  const requestText = [
    'Здравствуйте! Хочу узнать стоимость и срок поставки оборудования.',
    '',
    `Товар: ${product.title}`,
    product.article ? `Артикул: ${product.article}` : '',
    product.brand ? `Производитель: ${product.brand}` : '',
    '',
    'Помогите подобрать оборудование и рассчитать стоимость.',
  ]
    .filter(Boolean)
    .join('\n');
  const whatsappLink = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(requestText)}`;
  const emailLink = `mailto:${COMPANY_EMAIL}?subject=${encodeURIComponent(
    `Запрос по товару: ${product.title}`
  )}&body=${encodeURIComponent(requestText)}`;

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 md:px-8 md:py-12">
      <div className="mx-auto max-w-7xl">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-slate-400 transition hover:text-white"
        >
          ← Вернуться в каталог
        </Link>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <ProductGallery title={product.title} images={images} videos={videos} />

          <section className="rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-2xl md:p-8">
            <div className="mb-5 flex flex-wrap items-center gap-2">
              {product.brand && (
                <span className="rounded-lg border border-blue-800 bg-blue-950 px-3 py-1 text-xs font-black text-blue-300">
                  {product.brand}
                </span>
              )}
              <span
                className={`rounded-lg px-3 py-1 text-xs font-bold ${
                  product.in_stock
                    ? 'bg-emerald-950 text-emerald-300'
                    : 'bg-orange-950 text-orange-300'
                }`}
              >
                {product.in_stock ? 'В наличии' : 'Под заказ'}
              </span>
            </div>

            {product.article && (
              <p className="mb-2 font-mono text-xs text-slate-400">
                Артикул: {product.article}
              </p>
            )}

            <h1 className="mb-5 text-3xl font-black leading-tight md:text-4xl">
              {product.title}
            </h1>

            <p className="text-xs uppercase tracking-widest text-slate-400">Цена</p>
            <p className="mb-6 text-2xl font-black text-blue-400">По запросу</p>

            {(product.power_kw || product.purpose) && (
              <div className="mb-6 space-y-2 rounded-2xl border border-slate-700 bg-slate-800/80 p-4 text-sm text-slate-300">
                {product.power_kw && (
                  <p>
                    <strong className="text-white">Мощность:</strong> {product.power_kw} кВт
                  </p>
                )}
                {product.purpose && (
                  <p>
                    <strong className="text-white">Назначение:</strong> {product.purpose}
                  </p>
                )}
              </div>
            )}

            {product.description && (
              <div className="mb-8">
                <h2 className="mb-3 text-lg font-extrabold">Описание</h2>
                <p className="whitespace-pre-line text-sm leading-7 text-slate-300">
                  {product.description}
                </p>
              </div>
            )}

            <div className="flex flex-col gap-3">
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center rounded-xl bg-emerald-600 px-4 py-4 text-sm font-extrabold text-white transition hover:bg-emerald-500"
              >
                Написать в WhatsApp
              </a>
              <a
                href={emailLink}
                className="flex w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-4 text-sm font-extrabold text-white transition hover:bg-blue-500"
              >
                Отправить запрос на почту
              </a>
              {product.pdf_url && (
                <a
                  href={product.pdf_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full items-center justify-center rounded-xl border border-slate-600 bg-slate-800 px-4 py-4 text-sm font-bold text-white transition hover:bg-slate-700"
                >
                  📄 Скачать технический паспорт (PDF)
                </a>
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
