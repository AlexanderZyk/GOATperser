import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
    state: State = { hasError: false };

    static getDerivedStateFromError(): State {
        return { hasError: true };
    }

    componentDidCatch(error: Error, info: ErrorInfo) {
        console.error(error, info);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="loading-screen" style={{ flexDirection: 'column', gap: 16 }}>
                    <p style={{ color: 'var(--color-danger, #e53935)', fontSize: 18 }}>Что-то пошло не так</p>
                    <button className="btn btn--primary" onClick={() => this.setState({ hasError: false })}>
                        Попробовать снова
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}

export default ErrorBoundary;
