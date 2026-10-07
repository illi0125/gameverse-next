import React, { ReactNode } from 'react';

interface HomeSectionProps {
	id: string;
	title: string;
	description?: string;
	actions?: ReactNode;
	tone?: 'base' | 'raised';
	children: ReactNode;
}

/** Shared homepage section shell: heading row (title, description, actions) above the section body **/
const HomeSection = ({ id, title, description, actions, tone = 'base', children }: HomeSectionProps) => {
	const headingId = `${id}-heading`;

	return (
		<section className={`gv-section gv-section--${tone}`} aria-labelledby={headingId}>
			<div className="gv-container">
				<header className="gv-section__head">
					<div className="gv-section__titles">
						<h2 className="gv-section__title" id={headingId}>
							{title}
						</h2>
						{description && <p className="gv-section__desc">{description}</p>}
					</div>
					{actions && <div className="gv-section__actions">{actions}</div>}
				</header>
				{children}
			</div>
		</section>
	);
};

export default HomeSection;
