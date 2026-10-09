import React, { useEffect, useState } from 'react';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import DensityMediumRoundedIcon from '@mui/icons-material/DensityMediumRounded';
import DensitySmallRoundedIcon from '@mui/icons-material/DensitySmallRounded';

/** Shared building blocks for the GameVerse admin ("Control Room"). Presentation only. **/

export const AdminPageHeader = ({
	kicker,
	title,
	desc,
	children,
}: {
	kicker: string;
	title: string;
	desc?: string;
	children?: React.ReactNode;
}) => (
	<header className="gv-admin-head">
		<div>
			<p className="gv-admin-head__kicker">{kicker}</p>
			<h1 className="gv-admin-head__title">{title}</h1>
			{desc && <p className="gv-admin-head__desc">{desc}</p>}
		</div>
		{children && <div className="gv-admin-head__actions">{children}</div>}
	</header>
);

export interface AdminTab<V extends string = string> {
	value: V;
	label: string;
	count?: number;
}

/** Status tabs; counts are optional and come from real queries **/
export const AdminTabs = <V extends string>({
	tabs,
	value,
	onChange,
	label,
}: {
	tabs: AdminTab<V>[];
	value: V;
	onChange: (value: V) => void;
	label: string;
}) => (
	<div className="gv-admin-tabs" role="tablist" aria-label={label}>
		{tabs.map((tab) => {
			const selected = tab.value === value;
			return (
				<button
					type="button"
					role="tab"
					aria-selected={selected}
					key={tab.value}
					className={`gv-admin-tabs__tab ${selected ? 'is-current' : ''}`}
					onClick={() => onChange(tab.value)}
				>
					{tab.label}
					{tab.count !== undefined && <span className="gv-admin-tabs__count">{tab.count}</span>}
				</button>
			);
		})}
	</div>
);

/** Search field: Enter or the button submits, the cross clears **/
export const AdminSearch = ({
	value,
	placeholder,
	onChange,
	onSubmit,
	onClear,
}: {
	value: string;
	placeholder: string;
	onChange: (value: string) => void;
	onSubmit: () => void;
	onClear?: () => void;
}) => (
	<form
		className="gv-admin-search"
		role="search"
		onSubmit={(event) => {
			event.preventDefault();
			onSubmit();
		}}
	>
		<SearchRoundedIcon className="gv-admin-search__icon" aria-hidden />
		<input
			type="text"
			value={value}
			placeholder={placeholder}
			aria-label={placeholder}
			onChange={(event) => onChange(event.target.value)}
		/>
		{value && onClear && (
			<button type="button" className="gv-admin-search__clear" aria-label="Clear search" onClick={onClear}>
				<CloseRoundedIcon aria-hidden />
			</button>
		)}
		<button type="submit" className="gv-admin-search__go">
			Search
		</button>
	</form>
);

export type ChipTone = 'live' | 'hold' | 'alert' | 'off' | 'neutral';

/** Status chip; renders a button (with a caret) when it opens a menu **/
export const StatusChip = ({
	label,
	tone = 'neutral',
	onClick,
	ariaLabel,
}: {
	label: string;
	tone?: ChipTone;
	onClick?: (event: React.MouseEvent<HTMLElement>) => void;
	ariaLabel?: string;
}) =>
	onClick ? (
		<button
			type="button"
			className={`gv-admin-chip is-${tone} is-action`}
			onClick={onClick}
			aria-haspopup="menu"
			aria-label={ariaLabel}
		>
			{label}
			<span className="gv-admin-chip__caret" aria-hidden />
		</button>
	) : (
		<span className={`gv-admin-chip is-${tone}`}>{label}</span>
	);

export const AdminEmpty = ({ title, desc, children }: { title: string; desc?: string; children?: React.ReactNode }) => (
	<div className="gv-admin-empty">
		<p className="gv-admin-empty__title">{title}</p>
		{desc && <p className="gv-admin-empty__desc">{desc}</p>}
		{children}
	</div>
);

export type Density = 'comfortable' | 'compact';
const DENSITY_KEY = 'gv-admin-density';

/** Table density, remembered per browser (falls back to comfortable when storage is unavailable) **/
export const useAdminDensity = (): [Density, (value: Density) => void] => {
	const [density, setDensity] = useState<Density>('comfortable');
	useEffect(() => {
		try {
			const saved = window.localStorage.getItem(DENSITY_KEY);
			if (saved === 'compact' || saved === 'comfortable') setDensity(saved);
		} catch (err) {
			/* storage blocked: keep the default */
		}
	}, []);
	const update = (value: Density) => {
		setDensity(value);
		try {
			window.localStorage.setItem(DENSITY_KEY, value);
		} catch (err) {
			/* storage blocked: the choice still applies for this visit */
		}
	};
	return [density, update];
};

export const DensityToggle = ({ density, onChange }: { density: Density; onChange: (value: Density) => void }) => (
	<div className="gv-admin-density" role="group" aria-label="Table density">
		<button
			type="button"
			aria-pressed={density === 'comfortable'}
			className={density === 'comfortable' ? 'is-on' : ''}
			onClick={() => onChange('comfortable')}
			title="Comfortable rows"
		>
			<DensityMediumRoundedIcon aria-hidden />
			<span className="gv-visually-hidden">Comfortable rows</span>
		</button>
		<button
			type="button"
			aria-pressed={density === 'compact'}
			className={density === 'compact' ? 'is-on' : ''}
			onClick={() => onChange('compact')}
			title="Compact rows"
		>
			<DensitySmallRoundedIcon aria-hidden />
			<span className="gv-visually-hidden">Compact rows</span>
		</button>
	</div>
);
