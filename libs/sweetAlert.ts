import Swal, { SweetAlertIcon } from 'sweetalert2';
import { Messages } from './config';

/**
 * GameVerse look for every SweetAlert in the app (styles: scss/pc/common/gvAlert.scss).
 * Only presentation options live here; each export below keeps its name, parameters and result.
 */
const GvSwal = Swal.mixin({
	buttonsStyling: false,
	customClass: {
		popup: 'gv-alert',
		title: 'gv-alert__title',
		htmlContainer: 'gv-alert__text',
		icon: 'gv-alert__icon',
		actions: 'gv-alert__actions',
		confirmButton: 'gv-alert__btn gv-alert__btn--solid',
		cancelButton: 'gv-alert__btn',
		timerProgressBar: 'gv-alert__timer',
	},
	showClass: { popup: 'gv-alert--in' },
	hideClass: { popup: 'gv-alert--out' },
});

/** Square GameVerse icon chips instead of SweetAlert's round animated icons **/
const iconGlyphs: Record<SweetAlertIcon, string> = {
	success: '✓',
	error: '!',
	warning: '!',
	info: 'i',
	question: '?',
};
const gvIcon = (icon: SweetAlertIcon) => ({
	icon,
	iconHtml: `<span class="gv-alert__glyph" aria-hidden="true">${iconGlyphs[icon]}</span>`,
});

export const sweetErrorHandling = async (err: any) => {
	await GvSwal.fire({
		...gvIcon('error'),
		text: err.message,
		showConfirmButton: false,
	});
};

export const sweetTopSuccessAlert = async (msg: string, duration: number = 2000) => {
	await GvSwal.fire({
		position: 'center',
		...gvIcon('success'),
		titleText: msg.replace('Definer: ', ''),
		showConfirmButton: false,
		timer: duration,
	});
};

export const sweetContactAlert = async (msg: string, duration: number = 10000) => {
	await GvSwal.fire({
		titleText: msg,
		showConfirmButton: false,
		timer: duration,
	}).then();
};

export const sweetConfirmAlert = (msg: string) => {
	return new Promise(async (resolve, reject) => {
		await GvSwal.fire({
			...gvIcon('question'),
			text: msg,
			showCancelButton: true,
			showConfirmButton: true,
			confirmButtonText: 'Confirm',
			cancelButtonText: 'Cancel',
		}).then((response) => {
			if (response?.isConfirmed) resolve(true);
			else resolve(false);
		});
	});
};

export const sweetLoginConfirmAlert = (msg: string) => {
	return new Promise(async (resolve, reject) => {
		await GvSwal.fire({
			text: msg,
			showCancelButton: true,
			showConfirmButton: true,
			confirmButtonText: 'Login',
			cancelButtonText: 'Cancel',
		}).then((response) => {
			if (response?.isConfirmed) resolve(true);
			else resolve(false);
		});
	});
};

export const sweetErrorAlert = async (msg: string, duration: number = 3000) => {
	await GvSwal.fire({
		...gvIcon('error'),
		titleText: msg,
		showConfirmButton: false,
		timer: duration,
	});
};

export const sweetMixinErrorAlert = async (msg: string, duration: number = 3000) => {
	await GvSwal.fire({
		...gvIcon('error'),
		titleText: msg,
		showConfirmButton: false,
		timer: duration,
	});
};

export const sweetMixinSuccessAlert = async (msg: string, duration: number = 2000) => {
	await GvSwal.fire({
		...gvIcon('success'),
		titleText: msg,
		showConfirmButton: false,
		timer: duration,
	});
};

export const sweetBasicAlert = async (text: string) => {
	GvSwal.fire({ titleText: text });
};

export const sweetErrorHandlingForAdmin = async (err: any) => {
	const errorMessage = err.message ?? Messages.error1;
	await GvSwal.fire({
		...gvIcon('error'),
		text: errorMessage,
		showConfirmButton: false,
	});
};

export const sweetTopSmallSuccessAlert = async (
	msg: string,
	duration: number = 2000,
	enable_forward: boolean = false,
) => {
	const Toast = GvSwal.mixin({
		toast: true,
		position: 'top-end',
		showConfirmButton: false,
		timer: duration,
		timerProgressBar: true,
		customClass: {
			popup: 'gv-alert gv-alert--toast',
			title: 'gv-alert__title',
			icon: 'gv-alert__icon',
			timerProgressBar: 'gv-alert__timer',
		},
	});

	Toast.fire({
		...gvIcon('success'),
		titleText: msg,
	}).then((data) => {
		if (enable_forward) {
			window.location.reload();
		}
	});
};
