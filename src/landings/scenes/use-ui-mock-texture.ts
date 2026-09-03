'use client';

import { useEffect, useMemo } from 'react';
import * as THREE from 'three';

/** 목업 종류. */
export type UiMockKind = 'dashboard' | 'note' | 'chart';

interface UiMockOptions {
  /** 목업 종류. */
  kind: UiMockKind;
  /** 캔버스 가로 픽셀. 기본 1024. */
  width?: number;
  /** 캔버스 세로 픽셀. 기본 640. */
  height?: number;
  /** 강조색(버튼·막대). 기본 밝은 파랑. */
  accent?: string;
}

/** 둥근 사각형 경로. */
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Fluxnote 앱 화면을 흉내 낸 대시보드 목업을 그린다. */
function paintDashboard(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  accent: string,
): void {
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, w, h);

  // 좌측 사이드바
  ctx.fillStyle = '#111c33';
  ctx.fillRect(0, 0, w * 0.16, h);
  ctx.fillStyle = accent;
  roundRect(ctx, w * 0.03, h * 0.06, w * 0.1, h * 0.05, 8);
  ctx.fill();
  ctx.fillStyle = '#25344d';
  for (let i = 0; i < 5; i++) {
    roundRect(ctx, w * 0.03, h * (0.18 + i * 0.09), w * 0.1, h * 0.045, 6);
    ctx.fill();
  }

  // 상단 헤더
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(w * 0.16, 0, w * 0.84, h * 0.12);
  ctx.fillStyle = '#334155';
  roundRect(ctx, w * 0.2, h * 0.04, w * 0.22, h * 0.045, 6);
  ctx.fill();

  // KPI 카드 3장
  const cardY = h * 0.18;
  const cardW = w * 0.24;
  const cardH = h * 0.22;
  for (let i = 0; i < 3; i++) {
    const cx = w * 0.2 + i * (cardW + w * 0.03);
    ctx.fillStyle = '#1b2a42';
    roundRect(ctx, cx, cardY, cardW, cardH, 12);
    ctx.fill();
    ctx.fillStyle = i === 0 ? accent : '#475569';
    roundRect(ctx, cx + 18, cardY + 18, cardW * 0.4, 14, 4);
    ctx.fill();
    ctx.fillStyle = '#e2e8f0';
    ctx.font = `bold ${Math.round(h * 0.06)}px sans-serif`;
    ctx.fillText(['48.2k', '1,204', '97%'][i], cx + 18, cardY + cardH * 0.7);
  }

  // 하단 큰 차트 영역
  const chY = cardY + cardH + h * 0.05;
  ctx.fillStyle = '#1b2a42';
  roundRect(ctx, w * 0.2, chY, w * 0.76, h - chY - h * 0.06, 12);
  ctx.fill();
  // 꺾은선
  ctx.strokeStyle = accent;
  ctx.lineWidth = 4;
  ctx.beginPath();
  const n = 24;
  for (let i = 0; i <= n; i++) {
    const px = w * 0.23 + (i / n) * w * 0.7;
    const py =
      chY +
      (h - chY - h * 0.06) * (0.7 - 0.45 * Math.sin(i * 0.5) * Math.random());
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();
}

/** 노트 편집 화면 목업. */
function paintNote(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  accent: string,
): void {
  ctx.fillStyle = '#0b1220';
  ctx.fillRect(0, 0, w, h);
  // 종이
  ctx.fillStyle = '#f8fafc';
  roundRect(ctx, w * 0.1, h * 0.08, w * 0.8, h * 0.84, 16);
  ctx.fill();
  // 제목
  ctx.fillStyle = '#0f172a';
  roundRect(ctx, w * 0.16, h * 0.16, w * 0.5, h * 0.06, 6);
  ctx.fill();
  // 강조 블록
  ctx.fillStyle = accent;
  roundRect(ctx, w * 0.16, h * 0.28, w * 0.14, h * 0.04, 4);
  ctx.fill();
  // 본문 줄
  ctx.fillStyle = '#cbd5e1';
  for (let i = 0; i < 9; i++) {
    const lw = i % 3 === 2 ? 0.4 : 0.68;
    roundRect(ctx, w * 0.16, h * (0.37 + i * 0.06), w * lw, h * 0.028, 4);
    ctx.fill();
  }
  // 체크리스트
  ctx.strokeStyle = accent;
  ctx.lineWidth = 3;
  for (let i = 0; i < 3; i++) {
    const cy = h * (0.37 + (i + 5.5) * 0.06);
    ctx.strokeRect(w * 0.16, cy, h * 0.03, h * 0.03);
  }
}

/** 지표 막대 그래프 목업. */
function paintChart(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  accent: string,
): void {
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#1b2a42';
  roundRect(ctx, w * 0.06, h * 0.08, w * 0.88, h * 0.84, 14);
  ctx.fill();
  const base = h * 0.82;
  const count = 9;
  const gap = (w * 0.8) / count;
  for (let i = 0; i < count; i++) {
    const bx = w * 0.1 + i * gap;
    const bh = h * (0.12 + 0.55 * Math.abs(Math.sin(i * 1.3)));
    ctx.fillStyle = i === count - 2 ? accent : '#3b5170';
    roundRect(ctx, bx, base - bh, gap * 0.55, bh, 4);
    ctx.fill();
  }
}

/**
 * Fluxnote 앱 화면을 흉내 낸 목업을 `<canvas>`에 그려 three 텍스처로 돌려준다.
 * 이미지 에셋 없이 "제품 스크린샷 자리"를 코드로 채운다.
 *
 * @returns 메시의 `map`으로 쓸 CanvasTexture. 언마운트 시 dispose 된다.
 */
export function useUiMockTexture({
  kind,
  width = 1024,
  height = 640,
  accent = '#38bdf8',
}: UiMockOptions): THREE.CanvasTexture {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      if (kind === 'dashboard') paintDashboard(ctx, width, height, accent);
      else if (kind === 'note') paintNote(ctx, width, height, accent);
      else paintChart(ctx, width, height, accent);
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    return tex;
  }, [kind, width, height, accent]);

  useEffect(() => () => texture.dispose(), [texture]);

  return texture;
}
