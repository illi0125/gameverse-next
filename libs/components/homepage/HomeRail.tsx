import React, { ReactNode, RefObject, useCallback, useEffect, useRef, useState } from 'react';
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';

interface RailState {
	trackRef: RefObject<HTMLDivElement>;
	canPrev: boolean;
	canNext: boolean;
	scrollPage: (direction: 1 | -1) => void;
}

/** Horizontal scroll-snap rail state; re-measures when the number of rendered items changes **/
export const useHomeRail = (itemCount: number): RailState => {
	const trackRef = useRef<HTMLDivElement>(null);
	const [canPrev, setCanPrev] = useState(false);
	const [canNext, setCanNext] = useState(false);

	const measure = useCallback(() => {
		const el = trackRef.current;
		if (!el) return;
		setCanPrev(el.scrollLeft > 4);
		setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
	}, []);

	useEffect(() => {
		const el = trackRef.current;
		measure();
		el?.addEventListener('scroll', measure, { passive: true });
		window.addEventListener('resize', measure);
		return () => {
			el?.removeEventListener('scroll', measure);
			window.removeEventListener('resize', measure);
		};
	}, [measure, itemCount]);

	const scrollPage = (direction: 1 | -1) => {
		const el = trackRef.current;
		if (!el) return;
		const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		el.scrollBy({ left: direction * el.clientWidth * 0.85, behavior: reduceMotion ? 'auto' : 'smooth' });
	};

	return { trackRef, canPrev, canNext, scrollPage };
};

interface RailControlsProps {
	rail: RailState;
	label: string;
}

export const RailControls = ({ rail, label }: RailControlsProps) => {
	if (!rail.canPrev && !rail.canNext) return null;

	return (
		<div className="gv-rail-controls">
			<button
				type="button"
				className="gv-icon-btn"
				aria-label={`Previous ${label}`}
				disabled={!rail.canPrev}
				onClick={() => rail.scrollPage(-1)}
			>
				<ChevronLeftRoundedIcon aria-hidden />
			</button>
			<button
				type="button"
				className="gv-icon-btn"
				aria-label={`Next ${label}`}
				disabled={!rail.canNext}
				onClick={() => rail.scrollPage(1)}
			>
				<ChevronRightRoundedIcon aria-hidden />
			</button>
		</div>
	);
};

interface RailTrackProps {
	rail: RailState;
	label: string;
	itemClassName?: string;
	children: ReactNode;
}

export const RailTrack = ({ rail, label, itemClassName = '', children }: RailTrackProps) => (
	<div className="gv-rail" ref={rail.trackRef} role="list" aria-label={label} tabIndex={0}>
		{React.Children.map(children, (child) => (
			<div className={`gv-rail__item ${itemClassName}`} role="listitem">
				{child}
			</div>
		))}
	</div>
);
