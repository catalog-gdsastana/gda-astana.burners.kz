-- Несколько фотографий и видео для одного товара.
-- Выполните после 20260831_product_images.sql.

alter table public.products
  add column if not exists images jsonb,
  add column if not exists videos jsonb;

-- Если предыдущая попытка успела создать колонку videos как text[],
-- приводим обе колонки к единому формату JSON.
do $$
begin
  if (
    select udt_name
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'products'
      and column_name = 'images'
  ) = '_text' then
    alter table public.products alter column images drop default;
    alter table public.products
      alter column images type jsonb
      using coalesce(to_jsonb(images), '[]'::jsonb);
  end if;

  if (
    select udt_name
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'products'
      and column_name = 'videos'
  ) = '_text' then
    alter table public.products alter column videos drop default;
    alter table public.products
      alter column videos type jsonb
      using coalesce(to_jsonb(videos), '[]'::jsonb);
  end if;
end $$;

update public.products set images = '[]'::jsonb where images is null;
update public.products set videos = '[]'::jsonb where videos is null;

alter table public.products
  alter column images set default '[]'::jsonb,
  alter column images set not null,
  alter column videos set default '[]'::jsonb,
  alter column videos set not null;

-- Переносим ранее загруженное основное фото в новую галерею.
update public.products
set images = jsonb_build_array(image_url)
where image_url is not null
  and trim(image_url) <> ''
  and jsonb_array_length(images) = 0;

-- Разрешаем в существующем хранилище изображения и видео до 50 МБ.
-- Ограничение 5 МБ для фотографий дополнительно проверяется в админке.
update storage.buckets
set
  file_size_limit = 52428800,
  allowed_mime_types = array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'video/mp4',
    'video/webm',
    'video/quicktime'
  ]
where id = 'product-images';
