"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface Props {
  /** 클립보드에 복사할 원문. */
  text: string;
  /** 버튼에 붙는 접근성 라벨. 예: "프롬프트 예시 복사". */
  label: string;
}

/**
 * 텍스트를 클립보드에 복사하는 버튼.
 *
 * navigator.clipboard가 없는 환경(비 HTTPS·구형 브라우저)에서는
 * document.execCommand 폴백을 쓴다. 복사 성공 시 2초간 "복사됨"을 표시한다.
 */
export function CopyButton({ text, label }: Props) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  const copy = useCallback(async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const area = document.createElement("textarea");
        area.value = text;
        area.style.position = "fixed";
        area.style.opacity = "0";
        document.body.appendChild(area);
        area.select();
        document.execCommand("copy");
        document.body.removeChild(area);
      }
      setCopied(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      // 클립보드 접근이 거부된 경우 — 조용히 무시한다.
    }
  }, [text]);

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={label}
      className="shrink-0 rounded border border-neutral-300 px-2 py-1 text-xs text-neutral-600 transition-colors hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800"
    >
      {copied ? "복사됨" : "복사"}
    </button>
  );
}
