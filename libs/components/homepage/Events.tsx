import React from 'react';
import { Stack, Box } from '@mui/material';
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
	const device = useDeviceDetect();

	if (device === 'mobile') {
		return <div>EVENT CARD</div>;
	} else {
		return (
			<Stack
				className="event-card"
				style={{
					backgroundImage: `url(${event?.imageSrc})`,
					backgroundSize: 'cover',
					backgroundPosition: 'center',
					backgroundRepeat: 'no-repeat',
				}}
			>
				<Box component={'div'} className={'info'}>
					<strong>{event?.city}</strong>
					<span>{event?.eventTitle}</span>
				</Box>
				<Box component={'div'} className={'more'}>
					<span>{event?.description}</span>
				</Box>
			</Stack>
		);
	}
};

const Events = () => {
	const device = useDeviceDetect();

	if (device === 'mobile') {
		return <div>EVENT CARD</div>;
	} else {
		return (
			<Stack className={'events'}>
				<Stack className={'container'}>
					<Stack className={'info-box'}>
						<Box component={'div'} className={'left'}>
							<span className={'white'}>Events</span>
							<p className={'white'}>Events waiting your attention!</p>
						</Box>
					</Stack>
					<Stack className={'card-wrapper'}>
						{eventsData.map((event: EventData) => {
							return <EventCard event={event} key={event?.eventTitle} />;
						})}
					</Stack>
				</Stack>
			</Stack>
		);
	}
};

export default Events;
