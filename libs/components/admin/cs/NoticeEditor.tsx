import React, { useEffect, useState } from 'react';
import { Dialog, MenuItem, Select } from '@mui/material';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import { Notice } from '../../../types/notice/notice';
import { NoticeStatus, SupportTopic } from '../../../enums/notice.enum';
import { NOTICE_CONTENT_MAX, NOTICE_TITLE_MAX, NoticeKind, supportTopics, topicLabel } from './supportMeta';

export interface NoticeEditorValues {
	noticeTitle: string;
	noticeContent: string;
	noticeTopic?: SupportTopic;
	noticeEvent?: boolean;
	noticeStatus: NoticeStatus.HOLD | NoticeStatus.ACTIVE;
}

interface NoticeEditorProps {
	kind: NoticeKind;
	open: boolean;
	/** null creates a new entry **/
	notice: Notice | null;
	saving: boolean;
	onClose: () => void;
	onSave: (values: NoticeEditorValues) => void;
}

const emptyValues = (kind: NoticeKind): NoticeEditorValues => ({
	noticeTitle: '',
	noticeContent: '',
	noticeTopic: kind.hasTopic ? SupportTopic.GAMES : undefined,
	noticeEvent: kind.hasEvent ? false : undefined,
	noticeStatus: NoticeStatus.HOLD,
});

/** Create / edit dialog for an FAQ entry or a notice (limits mirror the API: title 3–150, content 3–5000) **/
export const NoticeEditor = ({ kind, open, notice, saving, onClose, onSave }: NoticeEditorProps) => {
	const [values, setValues] = useState<NoticeEditorValues>(emptyValues(kind));
	const [touched, setTouched] = useState(false);

	useEffect(() => {
		if (!open) return;
		setTouched(false);
		setValues(
			notice
				? {
						noticeTitle: notice.noticeTitle,
						noticeContent: notice.noticeContent,
						noticeTopic: kind.hasTopic ? notice.noticeTopic ?? SupportTopic.OTHER : undefined,
						noticeEvent: kind.hasEvent ? Boolean(notice.noticeEvent) : undefined,
						noticeStatus: notice.noticeStatus === NoticeStatus.ACTIVE ? NoticeStatus.ACTIVE : NoticeStatus.HOLD,
				  }
				: emptyValues(kind),
		);
	}, [open, notice]);

	const title = values.noticeTitle.trim();
	const content = values.noticeContent.trim();
	const titleError = title.length < 3 ? `${kind.titleLabel} needs at least 3 characters.` : '';
	const contentError = content.length < 3 ? `${kind.contentLabel} needs at least 3 characters.` : '';
	const valid = !titleError && !contentError;

	const submit = (event: React.FormEvent) => {
		event.preventDefault();
		setTouched(true);
		if (!valid || saving) return;
		onSave({ ...values, noticeTitle: title, noticeContent: content });
	};

	const set = <K extends keyof NoticeEditorValues>(key: K, value: NoticeEditorValues[K]) =>
		setValues((prev) => ({ ...prev, [key]: value }));

	const heading = `${notice ? 'Edit' : 'New'} ${kind.singular}`;

	return (
		<Dialog
			open={open}
			onClose={saving ? undefined : onClose}
			className="gv-admin-dialog"
			fullWidth
			maxWidth="sm"
			aria-labelledby="gv-notice-editor-title"
		>
			<form onSubmit={submit} noValidate>
				<header className="gv-admin-dialog__head">
					<h2 id="gv-notice-editor-title">{heading}</h2>
					<button type="button" className="gv-admin-iconbtn" aria-label="Close" onClick={onClose} disabled={saving}>
						<CloseRoundedIcon aria-hidden />
					</button>
				</header>

				<div className="gv-admin-dialog__body">
					{kind.hasTopic && (
						<label className="gv-admin-field">
							<span className="gv-admin-field__label">Topic</span>
							<Select
								value={values.noticeTopic ?? SupportTopic.OTHER}
								onChange={(e: any) => set('noticeTopic', e.target.value as SupportTopic)}
								MenuProps={{ className: 'gv-admin-menu' }}
							>
								{supportTopics.map((topic) => (
									<MenuItem value={topic} key={topic}>
										{topicLabel(topic)}
									</MenuItem>
								))}
							</Select>
						</label>
					)}

					<label className="gv-admin-field">
						<span className="gv-admin-field__label">
							{kind.titleLabel}
							<span className="gv-admin-field__count">
								{values.noticeTitle.length}/{NOTICE_TITLE_MAX}
							</span>
						</span>
						<input
							type="text"
							value={values.noticeTitle}
							maxLength={NOTICE_TITLE_MAX}
							onChange={(e) => set('noticeTitle', e.target.value)}
							aria-invalid={touched && Boolean(titleError)}
							autoFocus
						/>
						{touched && titleError && <span className="gv-admin-field__error">{titleError}</span>}
					</label>

					<label className="gv-admin-field">
						<span className="gv-admin-field__label">
							{kind.contentLabel}
							<span className="gv-admin-field__count">
								{values.noticeContent.length}/{NOTICE_CONTENT_MAX}
							</span>
						</span>
						<textarea
							rows={7}
							value={values.noticeContent}
							maxLength={NOTICE_CONTENT_MAX}
							onChange={(e) => set('noticeContent', e.target.value)}
							aria-invalid={touched && Boolean(contentError)}
						/>
						{touched && contentError && <span className="gv-admin-field__error">{contentError}</span>}
					</label>

					{kind.hasEvent && (
						<label className="gv-admin-check">
							<input
								type="checkbox"
								checked={Boolean(values.noticeEvent)}
								onChange={(e) => set('noticeEvent', e.target.checked)}
							/>
							<span>
								Highlight as an event
								<small>Shown with an event badge at the top of the public list.</small>
							</span>
						</label>
					)}

					<fieldset className="gv-admin-segment">
						<legend className="gv-admin-field__label">Visibility</legend>
						{[
							{ value: NoticeStatus.HOLD, label: 'Draft', hint: 'Hidden from the site' },
							{ value: NoticeStatus.ACTIVE, label: 'Published', hint: 'Visible on the Help page' },
						].map((option) => (
							<label key={option.value} className={values.noticeStatus === option.value ? 'is-on' : ''}>
								<input
									type="radio"
									name="noticeStatus"
									value={option.value}
									checked={values.noticeStatus === option.value}
									onChange={() => set('noticeStatus', option.value as NoticeEditorValues['noticeStatus'])}
								/>
								<span>{option.label}</span>
								<small>{option.hint}</small>
							</label>
						))}
					</fieldset>
				</div>

				<footer className="gv-admin-dialog__foot">
					<button type="button" className="gv-admin-btn is-ghost" onClick={onClose} disabled={saving}>
						Cancel
					</button>
					<button type="submit" className="gv-admin-btn" disabled={saving}>
						{saving ? 'Saving…' : notice ? 'Save changes' : values.noticeStatus === NoticeStatus.ACTIVE ? 'Publish' : 'Save draft'}
					</button>
				</footer>
			</form>
		</Dialog>
	);
};
