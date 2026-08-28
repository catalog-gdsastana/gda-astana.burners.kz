export interface CatalogCategory {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  icon: string | null;
  sort_order: number;
  is_active: boolean;
}

export const DEFAULT_MAIN_CATEGORY_ID = '00000000-0000-4000-8000-000000000001';
export const DEFAULT_SUBGROUP_ID = '00000000-0000-4000-8000-000000000101';

// Этот список используется как безопасный резерв, пока таблица каталога
// не создана в Supabase. Те же идентификаторы добавляются SQL-миграцией.
export const DEFAULT_CATALOG_CATEGORIES: CatalogCategory[] = [
  {
    id: DEFAULT_MAIN_CATEGORY_ID,
    name: 'Горелки',
    slug: 'burners',
    parent_id: null,
    icon: '🔥',
    sort_order: 10,
    is_active: true,
  },
  {
    id: '00000000-0000-4000-8000-000000000002',
    name: 'Запчасти для горелок',
    slug: 'burner-parts',
    parent_id: null,
    icon: '⚙️',
    sort_order: 20,
    is_active: true,
  },
  {
    id: DEFAULT_SUBGROUP_ID,
    name: 'Газовые горелки',
    slug: 'gas',
    parent_id: DEFAULT_MAIN_CATEGORY_ID,
    icon: '🔥',
    sort_order: 10,
    is_active: true,
  },
  {
    id: '00000000-0000-4000-8000-000000000102',
    name: 'Дизельные горелки',
    slug: 'diesel',
    parent_id: DEFAULT_MAIN_CATEGORY_ID,
    icon: '🛢️',
    sort_order: 20,
    is_active: true,
  },
  {
    id: '00000000-0000-4000-8000-000000000103',
    name: 'Комбинированные горелки',
    slug: 'combined',
    parent_id: DEFAULT_MAIN_CATEGORY_ID,
    icon: '⚡',
    sort_order: 30,
    is_active: true,
  },
  {
    id: '00000000-0000-4000-8000-000000000201',
    name: 'Насосы для горелок',
    slug: 'burner-pumps',
    parent_id: '00000000-0000-4000-8000-000000000002',
    icon: '🔩',
    sort_order: 10,
    is_active: true,
  },
  {
    id: '00000000-0000-4000-8000-000000000202',
    name: 'Топочные автоматы',
    slug: 'burner-controllers',
    parent_id: '00000000-0000-4000-8000-000000000002',
    icon: '🎛️',
    sort_order: 20,
    is_active: true,
  },
  {
    id: '00000000-0000-4000-8000-000000000203',
    name: 'Трансформаторы поджига',
    slug: 'ignition-transformers',
    parent_id: '00000000-0000-4000-8000-000000000002',
    icon: '⚡',
    sort_order: 30,
    is_active: true,
  },
  {
    id: '00000000-0000-4000-8000-000000000204',
    name: 'Реле давления',
    slug: 'pressure-switches',
    parent_id: '00000000-0000-4000-8000-000000000002',
    icon: '📟',
    sort_order: 40,
    is_active: true,
  },
  {
    id: '00000000-0000-4000-8000-000000000205',
    name: 'Форсунки',
    slug: 'nozzles',
    parent_id: '00000000-0000-4000-8000-000000000002',
    icon: '💧',
    sort_order: 50,
    is_active: true,
  },
  {
    id: '00000000-0000-4000-8000-000000000206',
    name: 'Электроды поджига и ионизации',
    slug: 'electrodes',
    parent_id: '00000000-0000-4000-8000-000000000002',
    icon: '〽️',
    sort_order: 60,
    is_active: true,
  },
  {
    id: '00000000-0000-4000-8000-000000000207',
    name: 'Датчики пламени',
    slug: 'flame-sensors',
    parent_id: '00000000-0000-4000-8000-000000000002',
    icon: '👁️',
    sort_order: 70,
    is_active: true,
  },
  {
    id: '00000000-0000-4000-8000-000000000208',
    name: 'Сервоприводы',
    slug: 'servomotors',
    parent_id: '00000000-0000-4000-8000-000000000002',
    icon: '🔄',
    sort_order: 80,
    is_active: true,
  },
  {
    id: '00000000-0000-4000-8000-000000000209',
    name: 'Электромагнитные клапаны',
    slug: 'solenoid-valves',
    parent_id: '00000000-0000-4000-8000-000000000002',
    icon: '🔧',
    sort_order: 90,
    is_active: true,
  },
  {
    id: '00000000-0000-4000-8000-000000000210',
    name: 'Газовые мультиблоки',
    slug: 'gas-multiblocks',
    parent_id: '00000000-0000-4000-8000-000000000002',
    icon: '🧩',
    sort_order: 100,
    is_active: true,
  },
  {
    id: '00000000-0000-4000-8000-000000000211',
    name: 'Газовые рампы',
    slug: 'gas-trains',
    parent_id: '00000000-0000-4000-8000-000000000002',
    icon: '🧰',
    sort_order: 110,
    is_active: true,
  },
  {
    id: '00000000-0000-4000-8000-000000000212',
    name: 'Прочие запчасти',
    slug: 'other-burner-parts',
    parent_id: '00000000-0000-4000-8000-000000000002',
    icon: '📦',
    sort_order: 120,
    is_active: true,
  },
];

export function sortCatalogCategories(categories: CatalogCategory[]) {
  return [...categories].sort(
    (a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name, 'ru')
  );
}

export function getCategoryLabel(
  categories: CatalogCategory[],
  categoryId?: string,
  legacySlug?: string
) {
  return (
    categories.find((item) => item.id === categoryId)?.name ||
    categories.find((item) => item.slug === legacySlug)?.name ||
    legacySlug ||
    'Без подгруппы'
  );
}
