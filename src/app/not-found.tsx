import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col items-center gap-4 px-6 py-24">
      <h1 className="text-xl font-semibold">페이지를 찾을 수 없습니다</h1>
      <Link href="/" className="text-sm underline">
        갤러리로 돌아가기
      </Link>
    </main>
  );
}
