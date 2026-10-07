import React, { ReactNode } from 'react';
import Link from 'next/link';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';

interface HomeHeroProps {
	search?: ReactNode;
	visual?: ReactNode;
}

/** Homepage hero: value proposition, primary actions, the catalog search and the 3D shelf **/
const HomeHero = ({ search, visual }: HomeHeroProps) => {
	return (
		<section className="gv-hero" aria-labelledby="gv-hero-title">
			<div className="gv-container gv-hero__inner">
				<h1 className="gv-hero__title" id="gv-hero-title">
					Find your next game.
				</h1>
				<p className="gv-hero__lead">
					Compare PC, console and mobile games by platform, genre, mode and price, and keep a list of the ones you
					want to play.
				</p>
				<div className="gv-hero__actions">
					<Link href={'/game'} className="gv-btn gv-btn--primary">
						Browse games
						<ArrowForwardRoundedIcon aria-hidden />
					</Link>
					<Link href={'/community?articleCategory=FREE'} className="gv-btn gv-btn--ghost">
						Join the community
					</Link>
				</div>
				{search && (
					<div className="gv-hero__search" role="search" aria-label="Search games">
						{search}
					</div>
				)}
			</div>
			{visual && (
				<div className="gv-hero__shelf" aria-hidden>
					{visual}
				</div>
			)}
		</section>
	);
};

export default HomeHero;
