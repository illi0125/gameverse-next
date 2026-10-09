import React, { useCallback, useEffect, useState } from 'react';
import { NextPage } from 'next';
import useDeviceDetect from '../../hooks/useDeviceDetect';
import MyPageHead from './MyPageHead';
import axios from 'axios';
import { Messages, REACT_APP_API_URL } from '../../config';
import { getJwtToken, updateStorage, updateUserInfo } from '../../auth';
import { useMutation, useReactiveVar } from '@apollo/client';
import { userVar } from '../../../apollo/store';
import { MemberUpdate } from '../../types/member/member.update';
import { UPDATE_MEMBER } from '../../../apollo/user/mutation';
import { sweetErrorHandling, sweetMixinSuccessAlert } from '../../sweetAlert';

const MyProfile: NextPage = ({ initialValues, ...props }: any) => {
	const device = useDeviceDetect();
	const token = getJwtToken();
	const user = useReactiveVar(userVar);
	const [updateData, setUpdateData] = useState<MemberUpdate>(initialValues);

	/** APOLLO REQUESTS **/
	const [updateMember] = useMutation(UPDATE_MEMBER);

	/** LIFECYCLES **/
	useEffect(() => {
		setUpdateData({
			...updateData,
			memberNick: user.memberNick,
			memberPhone: user.memberPhone,
			memberAddress: user.memberAddress,
			memberImage: user.memberImage,
		});
	}, [user]);

	/** HANDLERS **/
	const uploadImage = async (e: any) => {
		try {
			const image = e.target.files[0];
			console.log('+image:', image);

			const formData = new FormData();
			formData.append(
				'operations',
				JSON.stringify({
					query: `mutation ImageUploader($file: Upload!, $target: String!) {
						imageUploader(file: $file, target: $target) 
				  }`,
					variables: {
						file: null,
						target: 'member',
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
			console.log('+responseImage: ', responseImage);
			updateData.memberImage = responseImage;
			setUpdateData({ ...updateData });

			return `${REACT_APP_API_URL}/${responseImage}`;
		} catch (err) {
			console.log('Error, uploadImage:', err);
		}
	};

	const updateProfileHandler = useCallback(async () => {
		try {
			if (!user._id) throw new Error(Messages.error2);
			updateData._id = user._id;
			const result = await updateMember({ variables: { input: updateData } });

			// @ts-ignore
			const jwtToken = result.data.updateMember?.accessToken;
			await updateStorage({ jwtToken });
			updateUserInfo(result.data.updateMember?.accessToken);
			await sweetMixinSuccessAlert('information updated succesfully.');
		} catch (err: any) {
			sweetErrorHandling(err).then();
		}
	}, [updateData]);

	const doDisabledCheck = () => {
		if (
			updateData.memberNick === '' ||
			updateData.memberPhone === '' ||
			updateData.memberAddress === '' ||
			updateData.memberImage === ''
		) {
			return true;
		}
	};

	const preview = updateData?.memberImage ? `${REACT_APP_API_URL}/${updateData?.memberImage}` : `/img/profile/defaultUser.svg`;

	return (
		<div className="gv-mp-section gv-mp-profile">
			<MyPageHead kicker="Account" title="My profile" desc="Your name, contact details and photo. Changes apply after Update." />

			<form
				className="gv-mp-profile__form"
				onSubmit={(event) => {
					event.preventDefault();
					if (!doDisabledCheck()) updateProfileHandler();
				}}
			>
				<div className="gv-mp-profile__photo">
					<span className="gv-mp-profile__avatar">
						<img src={preview} alt="Profile photo preview" />
					</span>
					<div>
						<p className="gv-mp-field__label">Photo</p>
						<input type="file" hidden id="hidden-input" onChange={uploadImage} accept="image/jpg, image/jpeg, image/png" />
						<label htmlFor="hidden-input" className="gv-mp-btn gv-mp-btn--line">
							Upload photo
						</label>
						<p className="gv-mp-field__hint">JPG, JPEG or PNG.</p>
					</div>
				</div>

				<div className="gv-mp-profile__fields">
					<label className="gv-mp-field">
						<span className="gv-mp-field__label">Username</span>
						<input
							type="text"
							placeholder="Your username"
							value={updateData.memberNick}
							onChange={({ target: { value } }) => setUpdateData({ ...updateData, memberNick: value })}
						/>
					</label>
					<label className="gv-mp-field">
						<span className="gv-mp-field__label">Phone</span>
						<input
							type="text"
							placeholder="Your Phone"
							value={updateData.memberPhone}
							onChange={({ target: { value } }) => setUpdateData({ ...updateData, memberPhone: value })}
						/>
					</label>
					<label className="gv-mp-field gv-mp-field--wide">
						<span className="gv-mp-field__label">Address</span>
						<input
							type="text"
							placeholder="Your address"
							value={updateData.memberAddress}
							onChange={({ target: { value } }) => setUpdateData({ ...updateData, memberAddress: value })}
						/>
					</label>
				</div>

				<div className="gv-mp-profile__foot">
					<p className="gv-mp-field__hint">
						{doDisabledCheck() ? 'Fill in every field and add a photo to update.' : 'Ready to save.'}
					</p>
					<button type="submit" className="gv-mp-btn gv-mp-btn--solid" disabled={doDisabledCheck()}>
						Update profile
					</button>
				</div>
			</form>
		</div>
	);
};

MyProfile.defaultProps = {
	initialValues: {
		_id: '',
		memberImage: '',
		memberNick: '',
		memberPhone: '',
		memberAddress: '',
	},
};

export default MyProfile;
