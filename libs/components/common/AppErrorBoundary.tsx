import React, { Component, ErrorInfo, ReactNode } from 'react';
import GvErrorState from './GvErrorState';

interface AppErrorBoundaryProps {
	/** The route path: the boundary resets when it changes, so the next page renders normally **/
	resetKey: string;
	children: ReactNode;
}

interface AppErrorBoundaryState {
	hasError: boolean;
}

/** Keeps one broken page from unmounting the whole app (a white screen) **/
class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
	state: AppErrorBoundaryState = { hasError: false };

	static getDerivedStateFromError(): AppErrorBoundaryState {
		return { hasError: true };
	}

	componentDidCatch(error: Error, info: ErrorInfo) {
		console.error('[AppErrorBoundary]', error, info.componentStack);
	}

	componentDidUpdate(prevProps: AppErrorBoundaryProps) {
		if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) this.setState({ hasError: false });
	}

	render() {
		if (!this.state.hasError) return this.props.children;
		return (
			<GvErrorState
				code="ERR"
				title="Something broke."
				lead="This page hit an unexpected error. Reload it, or head back home."
				actions={
					<>
						<button type="button" className="gv-gd-cta gv-gd-cta--solid" onClick={() => window.location.reload()}>
							Reload page
						</button>
						{/* Full reload: the app may be in a broken state */}
						<a href="/" className="gv-gd-cta">
							Back to home
						</a>
					</>
				}
			/>
		);
	}
}

export default AppErrorBoundary;
