import React, { ReactNode } from 'react';
import Head from 'next/head';

interface GvErrorStateProps {
	code: string;
	title: string;
	lead: string;
	actions: ReactNode;
}

/**
 * Night "state" chapter shared by the 404 / 500 pages and the app error boundary.
 * Same markup and styles as the "Developer not found" state (`.gv-gd-state`, scss/pc/game/gameDetail.scss).
 */
const GvErrorState = ({ code, title, lead, actions }: GvErrorStateProps) => {
	return (
		<div className="gv-catalog gv-gd">
			<Head>
				<title>{`${title.replace(/\.$/, '')} | Gameverse`}</title>
				<meta name="robots" content="noindex" />
			</Head>
			<section className="gv-gd-state" aria-labelledby="gv-error-title">
				<div className="gv-cat-hero__grid" aria-hidden>
					<span className="gv-cat-hero__rule gv-cat-hero__rule--v" />
					<span className="gv-cat-hero__rule gv-cat-hero__rule--h" />
					<span className="gv-cat-hero__mark" />
				</div>
				<div className="gv-gd-state__inner">
					<p className="gv-chapter gv-chapter--dark" aria-hidden>
						<span>{code}</span>Signal lost
					</p>
					<h1 id="gv-error-title" className="gv-gd-state__title">
						{title}
					</h1>
					<p className="gv-gd-state__lead">{lead}</p>
					<div className="gv-gd-state__actions">{actions}</div>
				</div>
			</section>
		</div>
	);
};

export default GvErrorState;
