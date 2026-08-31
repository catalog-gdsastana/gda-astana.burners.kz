-- Справочник производителей для структуры:
-- Горелки -> Производитель -> Вид горелки -> Товар.
-- Выполните файл один раз после 20260828_catalog_hierarchy.sql.

create table if not exists public.manufacturers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint manufacturers_name_not_blank check (length(trim(name)) > 0)
);

create unique index if not exists manufacturers_name_lower_idx
  on public.manufacturers (lower(trim(name)));

alter table public.products
  add column if not exists manufacturer_id uuid references public.manufacturers(id) on delete set null;

create index if not exists products_manufacturer_id_idx
  on public.products(manufacturer_id);

-- Производители из уже существующих товаров автоматически попадут в справочник.
insert into public.manufacturers (name)
select distinct trim(product.brand)
from public.products as product
where product.brand is not null
  and trim(product.brand) <> ''
  and not exists (
    select 1
    from public.manufacturers as manufacturer
    where lower(trim(manufacturer.name)) = lower(trim(product.brand))
  );

update public.products as product
set manufacturer_id = manufacturer.id
from public.manufacturers as manufacturer
where product.manufacturer_id is null
  and product.brand is not null
  and lower(trim(product.brand)) = lower(trim(manufacturer.name));

alter table public.manufacturers enable row level security;

grant select, insert, update on table public.manufacturers to anon, authenticated;

drop policy if exists "Manufacturers are publicly readable" on public.manufacturers;
create policy "Manufacturers are publicly readable"
  on public.manufacturers
  for select
  to anon, authenticated
  using (true);

drop policy if exists "Manufacturers can be added from catalog admin" on public.manufacturers;
create policy "Manufacturers can be added from catalog admin"
  on public.manufacturers
  for insert
  to anon, authenticated
  with check (true);

drop policy if exists "Manufacturers can be updated from catalog admin" on public.manufacturers;
create policy "Manufacturers can be updated from catalog admin"
  on public.manufacturers
  for update
  to anon, authenticated
  using (true)
  with check (true);
