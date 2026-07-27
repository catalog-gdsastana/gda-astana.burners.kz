import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin', 'cyrillic'] });

export const metadata: Metadata = {
  title: 'ТОО GDS Astana — Промышленные горелки и котлы с доставкой по Казахстану',
  description: 'Поставка и обслуживание промышленных газовых, дизельных и комбинированных горелок, котлов и комплектующих. Доставка по всему Казахстану (Шымкент, Астана, Алматы и др.).',
  keywords: [
    'горелки промышленные Казахстан',
    'газовые горелки Шымкент',
    'дизельные горелки купить',
    'промышленные котлы Казахстан',
    'GDS Astana',
    'горелки Baltur',
    'запчасти для горелок'
  ],
  openGraph: {
    title: 'ТОО GDS Astana — Оборудование для котельных по всему Казахстану',
    description: 'Газовые, дизельные горелки, котлы и комплектующие. Быстрая доставка из Шымкента в любой регион РК.',
    type: 'website',
    locale: 'ru_RU',
    siteName: 'GDS Astana',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body className={inter.className}>{children}</body>
    </html>
  );
}