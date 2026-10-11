import React, { useEffect, useState } from 'react';
import '@toast-ui/editor/dist/toastui-editor.css';
import { Viewer } from '@toast-ui/react-editor';

/** "https://www.youtube.com/embed/<id>" or the youtube-nocookie host → a clean embed URL; anything else → null **/
export const youtubeEmbedSrc = (raw: unknown): string | null => {
	if (typeof raw !== 'string') return null;
	const match = raw.trim().match(/^https:\/\/www\.youtube(-nocookie)?\.com\/embed\/([\w-]{11})(?:[?#].*)?$/);
	return match ? `https://www.youtube${match[1] ?? ''}.com/embed/${match[2]}` : null;
};

const TViewer = (props: any) => {
	const [editorLoaded, setEditorLoaded] = useState(false);

	/** LIFECYCLES **/
	useEffect(() => {
		if (props.markdown) {
			setEditorLoaded(true);
		} else {
			setEditorLoaded(false);
		}
	}, [props.markdown]);

	return (
		<div className="gv-viewer">
			{editorLoaded ? (
				<Viewer
					initialValue={props.markdown}
					customHTMLRenderer={{
						htmlBlock: {
							iframe(node: any) {
								// Only YouTube embeds, with fixed attributes; any other frame in a post is dropped
								const src = youtubeEmbedSrc(node.attrs?.src);
								if (!src) return [];
								return [
									{
										type: 'openTag',
										tagName: 'iframe',
										outerNewLine: true,
										// The viewer's sanitizer keeps only these attributes (sandbox/allow would be stripped)
										attributes: { src, title: 'YouTube video', width: '560', height: '315' },
									},
									{ type: 'closeTag', tagName: 'iframe', outerNewLine: true },
								];
							},
							div(node: any) {
								return [
									{ type: 'openTag', tagName: 'div', outerNewLine: true, attributes: node.attrs },
									{ type: 'html', content: node.childrenHTML ?? '' },
									{ type: 'closeTag', tagName: 'div', outerNewLine: true },
								];
							},
						},
						htmlInline: {
							big(node: any, { entering }: any) {
								return entering
									? { type: 'openTag', tagName: 'big', attributes: node.attrs }
									: { type: 'closeTag', tagName: 'big' };
							},
						},
					}}
				/>
			) : (
				<p className="gv-viewer__loading">Loading post…</p>
			)}
		</div>
	);
};

export default TViewer;
