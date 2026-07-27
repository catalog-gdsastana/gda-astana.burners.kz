import { supabase } from '../../supabase';
import Link from 'next/link';

const categoryNames: Record<string, string> = {
  gas: 'Газовые горелки',
  diesel: 'Дизельные горелки',
  combined: 'Комбинированные горелки',
};

export default async function CategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const categoryTitle = categoryNames[id] || 'Горелки';

  // Фильтруем товары по полю category
  const { data: products } = await supabase
    .from('products')
    .select('*')
    .eq('category', id);

  return (
    <main className="min-h-screen bg-gray-50 p-6 md:p-12">
      <div className="max-w-6xl mx-auto">
        {/* Кнопка Назад */}
        <Link href="/" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 mb-8 transition">
          ← Назад ко всем категориям
        </Link>

        <header className="mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900">
            {categoryTitle}
          </h1>
          <p className="text-gray-500 mt-1">
            Найдено моделей: {products?.length || 0}
          </p>
        </header>

        {/* Сетка товаров */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {products && products.length > 0 ? (
            products.map((item, index) => (
              <div key={item.id || index} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition">
                <div className="flex justify-between items-start mb-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${item.in_stock ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {item.in_stock ? 'В наличии' : 'Под заказ'}
                  </span>
                  <span className="text-xs text-gray-400">Арт. {item.article || '—'}</span>
                </div>
                
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {item.title}
                </h3>
                
                <p className="text-gray-600 text-sm mb-6">
                  {item.description}
                </p>

                <div className="pt-4 border-t border-gray-100 flex gap-2">
                  <button className="flex-1 bg-gray-900 hover:bg-gray-800 text-white font-medium py-2 rounded-xl text-sm transition">
                    {item.pdf_url ? 'Скачать Паспорт (PDF)' : 'Подробнее'}
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full bg-white p-12 rounded-2xl text-center border">
              <p className="text-gray-500 text-lg">
                В этой категории пока нет товаров.
              </p>
              <p className="text-gray-400 text-sm mt-1">
                Убедитесь, что у товара в Supabase в поле <code className="bg-gray-100 px-2 py-0.5 rounded text-red-500">category</code> написано ровно: <strong>{id}</strong>
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
