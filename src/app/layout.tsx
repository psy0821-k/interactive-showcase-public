import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { SiteNav } from '@/components/site-nav';
import { SITE_URL, IS_INDEXABLE } from '@/lib/site';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

const SITE_TITLE = '3D Skill Showcase';
const SITE_DESCRIPTION =
  'React Three Fiber로 만든 3D 웹 기법 쇼케이스 39선. 재질·조명·포스트프로세싱·물리·' +
  '스크롤 인터랙션을 실제 동작하는 예제로 보여주고, 각 기법의 함정과 회피법을 정리했다.';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: `%s · ${SITE_TITLE}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_TITLE,
  authors: [{ name: 'psy0821-k' }],
  keywords: [
    'React Three Fiber',
    'three.js',
    '3D 웹',
    'WebGL',
    '포트폴리오',
    '쇼케이스',
    '포스트프로세싱',
  ],
  alternates: {
    canonical: '/',
  },
  robots: IS_INDEXABLE
    ? undefined
    : { index: false, follow: false, nocache: true },
  openGraph: {
    type: 'website',
    url: SITE_URL,
    siteName: SITE_TITLE,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    locale: 'ko_KR',
    images: [
      {
        url: '/thumbnails/emissive-bloom-lantern.webp',
        width: 800,
        height: 450,
        alt: '발광 오브젝트에 블룸 후처리를 적용한 3D 씬',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ['/thumbnails/emissive-bloom-lantern.webp'],
  },
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <SiteNav />
        {children}
      </body>
    </html>
  );
}
