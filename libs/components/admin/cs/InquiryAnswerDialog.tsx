import React, { useEffect, useState } from 'react';
import { Dialog } from '@mui/material';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import Moment from 'react-moment';
import { Inquiry } from '../../../types/inquiry/inquiry';
import { InquiryStatus } from '../../../enums/notice.enum';
import { StatusChip } from '../ui/AdminUi';
import { ANSWER_MAX, inquiryStatusLabels, inquiryStatusTone, topicLabel } from './supportMeta';

interface InquiryAnswerDialogProps {
	inquiry: Inquiry | null;
	busy: boolean;
	onClose: () => void;
	onAnswer: (inquiry: Inquiry, answerContent: string) => void;
	onStatus: (inquiry: Inquiry, inquiryStatus: InquiryStatus) => void;
}

/** Read the question, write or update the reply, close or reopen (API: reply 2–2000 chars, no reply while closed) **/
export const InquiryAnswerDialog = ({ inquiry, busy, onClose, onAnswer, onStatus }: InquiryAnswerDialogProps) => {
	const [answer, setAnswer] = useState('');
	const [touched, setTouched] = useState(false);

	useEffect(() => {
		setAnswer(inquiry?.answerContent ?? '');
		setTouched(false);
	}, [inquiry?._id]);

	if (!inquiry) return <Dialog open={false} />;

	const isClosed = inquiry.inquiryStatus === InquiryStatus.CLOSED;
	const hasAnswer = Boolean(inquiry.answerContent);
	const trimmed = answer.trim();
	const answerError = trimmed.length < 2 ? 'Write a reply of at least 2 characters.' : '';
	const unchanged = hasAnswer && trimmed === inquiry.answerContent?.trim();
	const label = inquiryStatusLabels[inquiry.inquiryStatus] ?? inquiry.inquiryStatus;

	const submit = (event: React.FormEvent) => {
		event.preventDefault();
		setTouched(true);
		if (answerError || busy || isClosed || unchanged) return;
		onAnswer(inquiry, trimmed);
	};

	return (
		<Dialog
			open={Boolean(inquiry)}
			onClose={busy ? undefined : onClose}
			className="gv-admin-dialog"
			fullWidth
			maxWidth="sm"
			aria-labelledby="gv-inquiry-title"
		>
			<form onSubmit={submit} noValidate>
				<header className="gv-admin-dialog__head">
					<div>
						<p className="gv-admin-dialog__meta">
							<StatusChip label={label} tone={inquiryStatusTone[inquiry.inquiryStatus] ?? 'neutral'} />
							<span>{topicLabel(inquiry.inquiryTopic)}</span>
						</p>
						<h2 id="gv-inquiry-title">{inquiry.inquiryTitle}</h2>
					</div>
					<button type="button" className="gv-admin-iconbtn" aria-label="Close" onClick={onClose} disabled={busy}>
						<CloseRoundedIcon aria-hidden />
					</button>
				</header>

				<div className="gv-admin-dialog__body">
					<section className="gv-admin-thread">
						<p className="gv-admin-thread__who">
							{inquiry.memberData?.memberNick ?? 'Deleted member'} ·{' '}
							<Moment format={'DD.MM.YY HH:mm'}>{inquiry.createdAt}</Moment>
						</p>
						<p className="gv-admin-thread__text">{inquiry.inquiryContent}</p>
					</section>

					{isClosed ? (
						<section className="gv-admin-thread is-reply">
							<p className="gv-admin-thread__who">
								Reply
								{inquiry.answeredAt && (
									<>
										{' · '}
										<Moment format={'DD.MM.YY HH:mm'}>{inquiry.answeredAt}</Moment>
									</>
								)}
							</p>
							<p className="gv-admin-thread__text">
								{inquiry.answerContent || <span className="gv-admin-muted">Closed without a reply.</span>}
							</p>
							<p className="gv-admin-field__hint">Reopen the inquiry to change the reply.</p>
						</section>
					) : (
						<label className="gv-admin-field">
							<span className="gv-admin-field__label">
								{hasAnswer ? 'Your reply (the member sees the latest version)' : 'Your reply'}
								<span className="gv-admin-field__count">
									{answer.length}/{ANSWER_MAX}
								</span>
							</span>
							<textarea
								rows={6}
								value={answer}
								maxLength={ANSWER_MAX}
								onChange={(e) => setAnswer(e.target.value)}
								aria-invalid={touched && Boolean(answerError)}
								autoFocus
							/>
							{touched && answerError && <span className="gv-admin-field__error">{answerError}</span>}
						</label>
					)}
				</div>

				<footer className="gv-admin-dialog__foot">
					{isClosed ? (
						<button
							type="button"
							className="gv-admin-btn is-ghost"
							disabled={busy}
							onClick={() => onStatus(inquiry, hasAnswer ? InquiryStatus.ANSWERED : InquiryStatus.PENDING)}
						>
							Reopen
						</button>
					) : (
						<button
							type="button"
							className="gv-admin-btn is-ghost"
							disabled={busy}
							onClick={() => onStatus(inquiry, InquiryStatus.CLOSED)}
						>
							Close inquiry
						</button>
					)}
					{!isClosed && (
						<button type="submit" className="gv-admin-btn" disabled={busy || unchanged}>
							{busy ? 'Saving…' : hasAnswer ? 'Update reply' : 'Send reply'}
						</button>
					)}
				</footer>
			</form>
		</Dialog>
	);
};
