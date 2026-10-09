import React from 'react';
import Link from 'next/link';
import { withRouter } from 'next/router';
import { ChatsCircle, EnvelopeSimple, GameController, Megaphone, Question, UsersThree } from 'phosphor-react';

/** Admin sections (same routes as before), grouped for the Control Room sidebar **/
export const adminNavGroups = [
	{
		title: 'Manage',
		items: [
			{ label: 'Users', href: '/_admin/users', icon: UsersThree },
			{ label: 'Games', href: '/_admin/games', icon: GameController },
			{ label: 'Community', href: '/_admin/community', icon: ChatsCircle },
		],
	},
	{
		title: 'Support',
		items: [
			{ label: 'FAQ', href: '/_admin/cs/faq', icon: Question },
			{ label: 'Notices', href: '/_admin/cs/notice', icon: Megaphone },
			{ label: 'Inquiries', href: '/_admin/cs/inquiry', icon: EnvelopeSimple },
		],
	},
];

/** Title for the top bar, from the current route **/
export const adminPageTitle = (pathname: string): { section: string; title: string } => {
	for (const group of adminNavGroups) {
		const item = group.items.find((entry) => pathname.startsWith(entry.href));
		if (item) return { section: group.title, title: item.label };
	}
	return { section: 'Control room', title: 'Overview' };
};

const AdminMenuList = (props: any) => {
	const {
		router: { pathname },
		onNavigate,
	} = props;

	return (
		<nav className="gv-admin-nav" aria-label="Admin sections">
			{adminNavGroups.map((group) => (
				<div className="gv-admin-nav__group" key={group.title}>
					<p className="gv-admin-nav__title">{group.title}</p>
					<ul>
						{group.items.map((item) => {
							const Icon = item.icon;
							const current = pathname.startsWith(item.href);
							return (
								<li key={item.href}>
									<Link
										href={item.href}
										className={`gv-admin-nav__item ${current ? 'is-current' : ''}`}
										aria-current={current ? 'page' : undefined}
										onClick={onNavigate}
									>
										<Icon size={18} weight={current ? 'fill' : 'regular'} aria-hidden />
										<span>{item.label}</span>
									</Link>
								</li>
							);
						})}
					</ul>
				</div>
			))}
		</nav>
	);
};

export default withRouter(AdminMenuList);
