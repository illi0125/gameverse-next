import React from 'react';

interface MyPageHeadProps {
	kicker: string;
	title: string;
	desc?: string;
	children?: React.ReactNode;
}

/** Section header used by every My Page panel: mono kicker, display title, one line of help, optional actions **/
const MyPageHead = ({ kicker, title, desc, children }: MyPageHeadProps) => (
	<header className="gv-mp-head">
		<div>
			<p className="gv-mp-head__kicker">{kicker}</p>
			<h2 className="gv-mp-head__title">{title}</h2>
			{desc && <p className="gv-mp-head__desc">{desc}</p>}
		</div>
		{children && <div className="gv-mp-head__actions">{children}</div>}
	</header>
);

export default MyPageHead;
