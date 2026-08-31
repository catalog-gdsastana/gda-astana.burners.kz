'use client';

import { useState } from 'react';

interface ProductMedia {
  url: string;
  kind: 'image' | 'video';
}

export default function ProductGallery({
  title,
  images,
  videos,
}: {
  title: string;
  images: string[];
  videos: string[];
}) {
  const media: ProductMedia[] = [
    ...images.map((url) => ({ url, kind: 'image' as const })),
    ...videos.map((url) => ({ url, kind: 'video' as const })),
  ];
  const [activeIndex, setActiveIndex] = useState(0);
  const activeMedia = media[activeIndex] || null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex h-[340px] w-full items-center justify-center overflow-hidden rounded-3xl border border-slate-700 bg-slate-800 p-5 md:h-[500px]">
        {activeMedia?.kind === 'image' ? (
          <img
            src={activeMedia.url}
            alt={title}
            className="h-full w-full object-contain"
          />
        ) : activeMedia?.kind === 'video' ? (
          <video
            key={activeMedia.url}
            src={activeMedia.url}
            className="h-full w-full object-contain"
            controls
            preload="metadata"
          />
        ) : (
          <div className="text-center text-slate-400">
            <div className="mb-2 text-4xl">📷</div>
            <p className="text-sm">Нет фото и видео</p>
          </div>
        )}
      </div>

      {media.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {media.map((item, index) => (
            <button
              key={`${item.kind}-${item.url}`}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={`relative h-20 w-24 shrink-0 overflow-hidden rounded-xl border-2 bg-slate-800 p-1 transition ${
                activeIndex === index
                  ? 'border-orange-500'
                  : 'border-slate-700 hover:border-slate-500'
              }`}
              aria-label={`${item.kind === 'image' ? 'Фотография' : 'Видео'} ${index + 1}`}
            >
              {item.kind === 'image' ? (
                <img src={item.url} alt="" className="h-full w-full object-contain" />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center text-slate-200">
                  <span className="text-2xl">▶</span>
                  <span className="text-[10px] font-bold">Видео</span>
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
