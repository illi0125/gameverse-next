import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Avatar, Box } from '@mui/material';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import ForumRoundedIcon from '@mui/icons-material/ForumRounded';
import { useRouter } from 'next/router';
import ScrollableFeed from 'react-scrollable-feed';
import { Member } from '../types/member/member';
import { useReactiveVar } from '@apollo/client';
import { socketVar, userVar } from '../../apollo/store';
import { sweetErrorAlert } from '../sweetAlert';
import { Messages, REACT_APP_API_URL } from '../config';

const NewMessage = (type: any) => {
	if (type === 'right') {
		return (
			<Box
				component={'div'}
				flexDirection={'row'}
				style={{ display: 'flex' }}
				alignItems={'flex-end'}
				justifyContent={'flex-end'}
				sx={{ m: '10px 0px' }}
			>
				<div className={'msg_right'}></div>
			</Box>
		);
	} else {
		return (
			<Box flexDirection={'row'} style={{ display: 'flex' }} sx={{ m: '10px 0px' }} component={'div'}>
				<Avatar alt={'jonik'} src={'/img/profile/defaultUser.svg'} />
				<div className={'msg_left'}></div>
			</Box>
		);
	}
};

interface MessagePayload {
	event: string;
	text: string;
	memberData: Member;
}
interface InfoPayload {
	event: string;
	totalClients: number;
	memberData: Member;
	action: string;
}

type Connection = 'connecting' | 'live' | 'offline';

/** WebSocket.readyState → what the header readout shows **/
const connectionOf = (socket?: WebSocket): Connection => {
	if (!socket || socket.readyState === 0) return 'connecting';
	return socket.readyState === 1 ? 'live' : 'offline';
};

/** Messages carry no id or time (socket contract), so the key is the position plus the sender **/
/** Guests have no id, so every guest message shares one sender; no message (list edge) → no sender **/
const senderId = (message?: MessagePayload): string | null => (message ? message.memberData?._id ?? 'guest' : null);

/** Global live chat (rendered by the desktop layouts): launcher, comms window, messages, composer **/
const Chat = () => {
	const chatContentRef = useRef<HTMLDivElement>(null);
	const [messagesList, setMessagesList] = useState<MessagePayload[]>([]);
	const [onlineUsers, setOnlineUsers] = useState<number>(0);
	const textInput = useRef<HTMLInputElement>(null);
	const [messageInput, setMessageInput] = useState<string>('');
	const [open, setOpen] = useState(false);
	const [openButton, setOpenButton] = useState(false);
	const router = useRouter();
	const user = useReactiveVar(userVar);
	const socket = useReactiveVar(socketVar);

	/** PRESENTATION STATE (frontend only) **/
	const rootRef = useRef<HTMLDivElement>(null);
	const launcherRef = useRef<HTMLButtonElement>(null);
	const openRef = useRef(open);
	// Texts sent from this tab, waiting for the server's echo; echoed messages are remembered as "mine"
	// (the contract has no message id, and a Guest's messages have no member id to compare)
	const sentRef = useRef<string[]>([]);
	const mineRef = useRef(new WeakSet<MessagePayload>());
	const [unread, setUnread] = useState(0);
	const [connection, setConnection] = useState<Connection>(connectionOf(socket));

	useEffect(() => {
		openRef.current = open;
		if (open) setUnread(0);
	}, [open]);

	/** LIFECYCLES **/
	useEffect(() => {
		if (!socket) return;
		socket.onmessage = (msg) => {
			const data = JSON.parse(msg.data);

			switch (data.event) {
				case 'info':
					const newInfo: InfoPayload = data;
					setOnlineUsers(newInfo.totalClients);
					break;
				case 'getMessages':
					const list: MessagePayload[] = data.list;
					setMessagesList(list);
					break;
				case 'message':
					const newMessage: MessagePayload = data;
					if (sentRef.current.length && sentRef.current[0] === newMessage.text) {
						sentRef.current.shift();
						mineRef.current.add(newMessage);
					}
					messagesList.push(newMessage);
					setMessagesList([...messagesList]);
					// Unread: other people's messages that arrive while the window is closed
					if (!openRef.current && !isMine(newMessage)) setUnread((count) => count + 1);
					break;
			}
		};
	}, [socket, messagesList, user]);

	// Connection readout: listeners only, the socket's own handlers stay as they are
	useEffect(() => {
		setConnection(connectionOf(socket));
		if (!socket) return;
		const update = () => setConnection(connectionOf(socket));
		socket.addEventListener('open', update);
		socket.addEventListener('close', update);
		socket.addEventListener('error', update);
		return () => {
			socket.removeEventListener('open', update);
			socket.removeEventListener('close', update);
			socket.removeEventListener('error', update);
		};
	}, [socket]);

	useEffect(() => {
		const timeoutId = setTimeout(() => {
			setOpenButton(true);
		}, 100);
		return () => clearTimeout(timeoutId);
	}, []);

	useEffect(() => {
		setOpenButton(false);
	}, [router.pathname]);

	// A click or tap anywhere outside the widget closes it (alerts opened by the chat don't count as outside)
	useEffect(() => {
		if (!open) return;
		const onPointerDown = (event: PointerEvent) => {
			const target = event.target as Element | null;
			if (!target || rootRef.current?.contains(target) || target.closest?.('.swal2-container')) return;
			setOpen(false);
		};
		document.addEventListener('pointerdown', onPointerDown);
		return () => document.removeEventListener('pointerdown', onPointerDown);
	}, [open]);

	// Opening focuses the composer; Escape closes and hands focus back to the launcher
	useEffect(() => {
		if (!open) return;
		const focusId = window.setTimeout(() => textInput.current?.focus(), 180);
		const onKey = (event: KeyboardEvent) => {
			if (event.key === 'Escape') {
				setOpen(false);
				launcherRef.current?.focus();
			}
		};
		document.addEventListener('keydown', onKey);
		return () => {
			window.clearTimeout(focusId);
			document.removeEventListener('keydown', onKey);
		};
	}, [open]);

	/** Mine = sent from this tab, or sent by the signed-in member (any device or tab) **/
	function isMine(message: MessagePayload): boolean {
		if (mineRef.current.has(message)) return true;
		return Boolean(user?._id) && message.memberData?._id === user._id;
	}

	/** Grouping key: my messages never merge with another Guest's **/
	const groupKey = (message?: MessagePayload) => (message && isMine(message) ? 'me' : senderId(message));

	/** HANDLERS **/
	const handleOpenChat = () => {
		setOpen((prevState) => !prevState);
	};

	const getInputMessageHandler = useCallback(
		(e: any) => {
			const text = e.target.value;
			setMessageInput(text);
		},
		[messageInput],
	);

	const getKeyHandler = (e: any) => {
		try {
			if (e.key == 'Enter') {
				onClickHandler();
			}
		} catch (err: any) {
			console.log(err);
		}
	};

	const onClickHandler = () => {
		if (!messageInput) sweetErrorAlert(Messages.error4);
		else if (connectionOf(socket) !== 'live') sweetErrorAlert('Chat is not connected. Please try again in a moment.');
		else {
			socket.send(JSON.stringify({ event: 'message', data: messageInput }));
			sentRef.current.push(messageInput);
			setMessageInput('');
		}
	};

	/** PRESENTATION **/
	const connectionLabel: Record<Connection, string> = {
		connecting: 'Connecting',
		live: `${onlineUsers} online`,
		offline: 'Offline',
	};

	return (
		<div className={`gv-chat ${open ? 'is-open' : ''}`} ref={rootRef}>
			{openButton ? (
				<button
					ref={launcherRef}
					type="button"
					className="gv-chat__launcher"
					onClick={handleOpenChat}
					aria-expanded={open}
					aria-controls="gv-chat-window"
					aria-label={
						open
							? 'Close live chat'
							: `Open live chat${unread ? `, ${unread} new message${unread === 1 ? '' : 's'}` : ''}`
					}
				>
					<span className="gv-chat__launcher-icon" aria-hidden>
						{open ? <CloseRoundedIcon /> : <ForumRoundedIcon />}
					</span>
					<span className="gv-chat__launcher-label" aria-hidden>
						{open ? 'Close' : 'Live chat'}
					</span>
					{!open && unread > 0 && (
						<span className="gv-chat__unread" key={unread} aria-hidden>
							{unread > 9 ? '9+' : unread}
						</span>
					)}
				</button>
			) : null}

			<section
				className="gv-chat__window"
				id="gv-chat-window"
				role="dialog"
				aria-modal="false"
				aria-labelledby="gv-chat-title"
				aria-hidden={!open}
				// @ts-ignore — `inert` keeps the closed window out of the tab order (React 18 passes it through as an attribute)
				inert={open ? undefined : ''}
			>
				<header className="gv-chat__head">
					<div>
						<p className="gv-chat__kicker" aria-hidden>
							<span>00</span>Comms
						</p>
						<h2 className="gv-chat__title" id="gv-chat-title">
							Live chat
						</h2>
					</div>
					<p className={`gv-chat__status is-${connection}`} aria-live="polite">
						{connectionLabel[connection]}
					</p>
					<button type="button" className="gv-chat__close" aria-label="Close live chat" onClick={() => setOpen(false)}>
						<CloseRoundedIcon aria-hidden />
					</button>
				</header>

				<div className="gv-chat__content" id="chat-content" ref={chatContentRef}>
					<ScrollableFeed>
						<div className="gv-chat__feed">
							<div className="gv-chat__welcome">
								<p className="gv-chat__welcome-title">Welcome to Live chat!</p>
								<p className="gv-chat__welcome-desc">
									Talk with everyone on GameVerse right now. Recent messages stay here.
								</p>
							</div>

							{messagesList.length === 0 && (
								<p className="gv-chat__empty">
									{connection === 'offline' ? 'Chat is offline.' : 'No messages yet. Say hi.'}
								</p>
							)}

							<ol className="gv-chat__list" aria-label="Messages">
								{messagesList.map((ele: MessagePayload, index: number) => {
									const { text, memberData } = ele;
									const memberImage = memberData?.memberImage
										? `${REACT_APP_API_URL}/${memberData.memberImage}`
										: '/img/profile/defaultUser.svg';
									const mine = isMine(ele);
									// Consecutive messages from one sender form a group: name and avatar only on the first
									const first = groupKey(messagesList[index - 1]) !== groupKey(ele);
									const last = groupKey(messagesList[index + 1]) !== groupKey(ele);
									const name = memberData?.memberNick ?? 'Guest';

									return (
										<li
											key={`${index}-${senderId(ele)}`}
											className={`gv-chat__msg ${mine ? 'is-mine' : 'is-theirs'} ${first ? 'is-first' : ''} ${
												last ? 'is-last' : ''
											}`}
										>
											{!mine && (
												<span className="gv-chat__avatar" aria-hidden>
													{last && <img src={memberImage} alt="" />}
												</span>
											)}
											<div className="gv-chat__stack">
												{first && <span className="gv-chat__name">{mine ? 'You' : name}</span>}
												<p className="gv-chat__bubble">
													{!first && <span className="gv-visually-hidden">{mine ? 'You' : name}: </span>}
													{text}
												</p>
											</div>
										</li>
									);
								})}
							</ol>
						</div>
					</ScrollableFeed>
				</div>

				<div className="gv-chat__composer">
					<label className="gv-visually-hidden" htmlFor="gv-chat-input">
						Message
					</label>
					<input
						id="gv-chat-input"
						ref={textInput}
						type={'text'}
						name={'message'}
						className={'gv-chat__input'}
						placeholder={user?._id ? `Message as ${user.memberNick}` : 'Message as Guest'}
						value={messageInput}
						onChange={getInputMessageHandler}
						onKeyDown={getKeyHandler}
						autoComplete="off"
						enterKeyHint="send"
					/>
					<button
						type="button"
						className={`gv-chat__send ${messageInput ? 'is-ready' : ''}`}
						onClick={onClickHandler}
						aria-label="Send message"
					>
						<SendRoundedIcon aria-hidden />
					</button>
				</div>
			</section>
		</div>
	);
};

export default Chat;
