'use client';

import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback: ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * Scene 로드/렌더 실패를 가둔다 (PRD 16절).
 *
 * 훅으로는 렌더 단계 예외를 잡을 수 없어 클래스 컴포넌트를 쓴다.
 * 쇼케이스 하나가 깨져도 상세 페이지 전체가 흰 화면이 되지 않게 하는 것이 목적.
 */
export class SceneErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[showcase] Scene 렌더 실패', error, info.componentStack);
  }

  render(): ReactNode {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}
