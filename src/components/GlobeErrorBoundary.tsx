import { Component, type ReactNode } from 'react';

interface Props {
  fallback: ReactNode;
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class GlobeErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.warn('Globe render failed, falling back to static atlas.', error);
  }

  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}
