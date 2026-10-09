import React, { useMemo, useRef, useState } from 'react';
import { BoardArticleCategory } from '../../enums/board-article.enum';
import { Editor } from '@toast-ui/react-editor';
import { getJwtToken } from '../../auth';
import { REACT_APP_API_URL } from '../../config';
import { useRouter } from 'next/router';
import axios from 'axios';
import { T } from '../../types/common';
import '@toast-ui/editor/dist/toastui-editor.css';
import { useMutation } from '@apollo/client';
import { CREATE_BOARD_ARTICLE } from '../../../apollo/user/mutation';
import { Message } from '../../enums/common.enum';
import { sweetErrorHandling, sweetTopSuccessAlert } from '../../sweetAlert';

const TuiEditor = () => {
	const editorRef = useRef<Editor>(null),
		token = getJwtToken(),
		router = useRouter();
	const [articleCategory, setArticleCategory] = useState<BoardArticleCategory>(BoardArticleCategory.FREE);

	/** APOLLO REQUESTS **/
	const [createboardArticle] = useMutation(CREATE_BOARD_ARTICLE);

	const memoizedValues = useMemo(() => {
		const articleTitle = '',
			articleContent = '',
			articleImage = '';

		return { articleTitle, articleContent, articleImage };
	}, []);

	/** HANDLERS **/
	const uploadImage = async (image: any) => {
		try {
			const formData = new FormData();
			formData.append(
				'operations',
				JSON.stringify({
					query: `mutation ImageUploader($file: Upload!, $target: String!) {
						imageUploader(file: $file, target: $target) 
				  }`,
					variables: {
						file: null,
						target: 'article',
					},
				}),
			);
			formData.append(
				'map',
				JSON.stringify({
					'0': ['variables.file'],
				}),
			);
			formData.append('0', image);

			const response = await axios.post(`${process.env.REACT_APP_API_GRAPHQL_URL}`, formData, {
				headers: {
					'Content-Type': 'multipart/form-data',
					'apollo-require-preflight': true,
					Authorization: `Bearer ${token}`,
				},
			});

			const responseImage = response.data.data.imageUploader;
			console.log('=responseImage: ', responseImage);
			memoizedValues.articleImage = responseImage;

			return `${REACT_APP_API_URL}/${responseImage}`;
		} catch (err) {
			console.log('Error, uploadImage:', err);
		}
	};

	const changeCategoryHandler = (e: any) => {
		setArticleCategory(e.target.value);
	};

	const articleTitleHandler = (e: T) => {
		console.log(e.target.value);
		memoizedValues.articleTitle = e.target.value;
	};

	const handleRegisterButton = async () => {
		try {
			const editor = editorRef.current;
			const articleContent = editor?.getInstance().getHTML() as string;
			memoizedValues.articleContent = articleContent;

			if (memoizedValues.articleContent === '' && memoizedValues.articleTitle === '') {
				throw new Error(Message.INSERT_ALL_INPUTS);
			}

			await createboardArticle({
				variables: {
					input: { ...memoizedValues, articleCategory },
				},
			});

			await sweetTopSuccessAlert('Article is created successfully', 700);
			await router.push({ pathname: '/mypage', query: { category: 'myArticles' } });
		} catch (err: any) {
			console.log(err);
			sweetErrorHandling(new Error(Message.INSERT_ALL_INPUTS)).then();
		}
	};

	const doDisabledCheck = () => {
		if (memoizedValues.articleContent === '' || memoizedValues.articleTitle === '') {
			return true;
		}
	};

	const boards = [
		{ value: BoardArticleCategory.FREE, label: 'Free' },
		{ value: BoardArticleCategory.RECOMMEND, label: 'Recommendation' },
		{ value: BoardArticleCategory.NEWS, label: 'News' },
		{ value: BoardArticleCategory.HUMOR, label: 'Humor' },
	];

	return (
		<div className="gv-editor">
			<fieldset className="gv-editor__boards">
				<legend className="gv-mp-field__label">Board</legend>
				<div className="gv-editor__chips">
					{boards.map((board) => (
						<label key={board.value} className={`gv-editor__chip ${articleCategory === board.value ? 'is-on' : ''}`}>
							<input
								type="radio"
								name="article-board"
								value={board.value}
								checked={articleCategory === board.value}
								onChange={changeCategoryHandler}
							/>
							{board.label}
						</label>
					))}
				</div>
			</fieldset>

			<label className="gv-editor__title">
				<span className="gv-mp-field__label">Title</span>
				<input type="text" placeholder="Type title" maxLength={50} onChange={articleTitleHandler} />
			</label>

			<div className="gv-editor__body">
				<Editor
					initialValue={'Type here'}
					placeholder={'Type here'}
					previewStyle={'vertical'}
					height={'560px'}
					// @ts-ignore
					initialEditType={'WYSIWYG'}
					toolbarItems={[
						['heading', 'bold', 'italic', 'strike'],
						['image', 'table', 'link'],
						['ul', 'ol', 'task'],
					]}
					ref={editorRef}
					hooks={{
						addImageBlobHook: async (image: any, callback: any) => {
							const uploadedImageURL = await uploadImage(image);
							callback(uploadedImageURL);
							return false;
						},
					}}
					events={{
						load: function (param: any) {},
					}}
				/>
			</div>

			<div className="gv-editor__foot">
				<p className="gv-mp-field__hint">Titles are 3–50 characters. Your post appears on the board right after you publish.</p>
				<button type="button" className="gv-mp-btn gv-mp-btn--solid" onClick={handleRegisterButton}>
					Publish
				</button>
			</div>
		</div>
	);
};

export default TuiEditor;
