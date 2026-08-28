-- Многоуровневый каталог: основной раздел -> подгруппа -> товар.
-- Выполните файл один раз в Supabase: SQL Editor -> New query -> Run.

create table if not exists public.catalog_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  parent_id uuid references public.catalog_categories(id) on delete restrict,
  icon text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint catalog_categories_no_self_parent check (parent_id is null or parent_id <> id)
);

create index if not exists catalog_categories_parent_id_idx
  on public.catalog_categories(parent_id);

alter table public.products
  add column if not exists category_id uuid references public.catalog_categories(id) on delete set null;

create index if not exists products_category_id_idx
  on public.products(category_id);

insert into public.catalog_categories (id, name, slug, parent_id, icon, sort_order)
values
  ('00000000-0000-4000-8000-000000000001', 'Горелки', 'burners', null, '🔥', 10),
  ('00000000-0000-4000-8000-000000000002', 'Запчасти для горелок', 'burner-parts', null, '⚙️', 20)
on conflict (slug) do update set
  name = excluded.name,
  icon = excluded.icon,
  sort_order = excluded.sort_order;

insert into public.catalog_categories (id, name, slug, parent_id, icon, sort_order)
values
  ('00000000-0000-4000-8000-000000000101', 'Газовые горелки', 'gas', '00000000-0000-4000-8000-000000000001', '🔥', 10),
  ('00000000-0000-4000-8000-000000000102', 'Дизельные горелки', 'diesel', '00000000-0000-4000-8000-000000000001', '🛢️', 20),
  ('00000000-0000-4000-8000-000000000103', 'Комбинированные горелки', 'combined', '00000000-0000-4000-8000-000000000001', '⚡', 30),
  ('00000000-0000-4000-8000-000000000201', 'Насосы для горелок', 'burner-pumps', '00000000-0000-4000-8000-000000000002', '🔩', 10),
  ('00000000-0000-4000-8000-000000000202', 'Топочные автоматы', 'burner-controllers', '00000000-0000-4000-8000-000000000002', '🎛️', 20),
  ('00000000-0000-4000-8000-000000000203', 'Трансформаторы поджига', 'ignition-transformers', '00000000-0000-4000-8000-000000000002', '⚡', 30),
  ('00000000-0000-4000-8000-000000000204', 'Реле давления', 'pressure-switches', '00000000-0000-4000-8000-000000000002', '📟', 40),
  ('00000000-0000-4000-8000-000000000205', 'Форсунки', 'nozzles', '00000000-0000-4000-8000-000000000002', '💧', 50),
  ('00000000-0000-4000-8000-000000000206', 'Электроды поджига и ионизации', 'electrodes', '00000000-0000-4000-8000-000000000002', '〽️', 60),
  ('00000000-0000-4000-8000-000000000207', 'Датчики пламени', 'flame-sensors', '00000000-0000-4000-8000-000000000002', '👁️', 70),
  ('00000000-0000-4000-8000-000000000208', 'Сервоприводы', 'servomotors', '00000000-0000-4000-8000-000000000002', '🔄', 80),
  ('00000000-0000-4000-8000-000000000209', 'Электромагнитные клапаны', 'solenoid-valves', '00000000-0000-4000-8000-000000000002', '🔧', 90),
  ('00000000-0000-4000-8000-000000000210', 'Газовые мультиблоки', 'gas-multiblocks', '00000000-0000-4000-8000-000000000002', '🧩', 100),
  ('00000000-0000-4000-8000-000000000211', 'Газовые рампы', 'gas-trains', '00000000-0000-4000-8000-000000000002', '🧰', 110),
  ('00000000-0000-4000-8000-000000000212', 'Прочие запчасти', 'other-burner-parts', '00000000-0000-4000-8000-000000000002', '📦', 120)
on conflict (slug) do update set
  name = excluded.name,
  parent_id = excluded.parent_id,
  icon = excluded.icon,
  sort_order = excluded.sort_order;

-- Существующие горелки автоматически получают соответствующую подгруппу.
update public.products as product
set category_id = category.id
from public.catalog_categories as category
where product.category_id is null
  and product.category = category.slug
  and category.slug in ('gas', 'diesel', 'combined');

alter table public.catalog_categories enable row level security;

grant select on table public.catalog_categories to anon, authenticated;

drop policy if exists "Catalog categories are publicly readable" on public.catalog_categories;
create policy "Catalog categories are publicly readable"
  on public.catalog_categories
  for select
  to anon, authenticated
  using (is_active = true);
