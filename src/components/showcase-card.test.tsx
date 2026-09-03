import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ShowcaseCard } from './showcase-card';
import type { ShowcaseEntry } from '@/domain/showcase';

// vitest + RTL 배선 확인용 스모크 테스트.
const entry: ShowcaseEntry = {
  slug: 'test-scene',
  meta: {
    title: '테스트 씬',
    description: '설명 문구',
    category: 'interactive-art',
    usedSkills: ['gesture-orbit-inertia'],
  },
  thumbnail: '/thumbnails/test-scene.webp',
};

describe('ShowcaseCard', () => {
  it('제목·설명과 상세 링크를 렌더한다', () => {
    render(<ShowcaseCard entry={entry} />);

    expect(
      screen.getByRole('heading', { name: '테스트 씬' }),
    ).toBeInTheDocument();
    expect(screen.getByText('설명 문구')).toBeInTheDocument();
    expect(screen.getByRole('link')).toHaveAttribute(
      'href',
      '/showcase/test-scene',
    );
  });
});
