import React from 'react';
import HomeSection from './HomeSection';
import useDeviceDetect from '../../hooks/useDeviceDetect';

interface EventData {
	eventTitle: string;
	city: string;
	description: string;
	imageSrc: string;
}
const eventsData: EventData[] = [
	{
		eventTitle: 'Indie Showcase',
		city: 'Online',
		description: 'Discover upcoming indie games from small studios and add them to your favorites before release.',
		imageSrc: '/img/gameverse/event-1.svg',
	},
	{
		eventTitle: 'Co-op Weekend',
		city: 'Community',
		description: 'Team up with friends and explore co-op and multiplayer games picked by the community.',
		imageSrc: '/img/gameverse/event-2.svg',
	},
	{
		eventTitle: 'Retro Game Night',
		city: 'Community',
		description: 'Share your favorite classics and talk about the games that started it all.',
		imageSrc: '/img/gameverse/event-3.svg',
	},
	{
		eventTitle: 'Speedrun Marathon',
		city: 'Online',
		description: 'Watch fast runs of popular titles and post your own personal bests in the community.',
		imageSrc: '/img/gameverse/event-4.svg',
	},
];

const EventCard = ({ event }: { event: EventData }) => {
	return (
		<article className="gv-event">
			<img className="gv-event__art" src={event?.imageSrc} alt="" width={600} height={800} loading="lazy" decoding="async" />
			<div className="gv-event__body">
				<span className="gv-event__where">{event?.city}</span>
				<h3 className="gv-event__title">{event?.eventTitle}</h3>
				<p className="gv-event__desc">{event?.description}</p>
			</div>
		</article>
	);
};

const Events = () => {
	const device = useDeviceDetect();

	if (device === 'mobile') {
		return <div>EVENT CARD</div>;
	} else {
		return (
			<HomeSection id="events" title="Events" description="Community events worth your attention.">
				<ul className="gv-events" aria-label="Events">
					{eventsData.map((event: EventData) => (
						<li key={event?.eventTitle}>
							<EventCard event={event} />
						</li>
					))}
				</ul>
			</HomeSection>
		);
	}
};

export default Events;
