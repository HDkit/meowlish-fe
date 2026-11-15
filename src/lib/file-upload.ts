import { FilesService } from './api-client';

/** Image types file-service accepts (`POST /files` rejects anything else). */
export const IMAGE_TYPES = ['image/jpeg', 'image/png'] as const;
/** file-service's upload limit. */
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

/** Why this file can't be uploaded as an image, in Vietnamese; null when it can. */
export function imageFileProblem(file: { type: string; size: number }): string | null {
	if (!(IMAGE_TYPES as readonly string[]).includes(file.type)) return 'Chỉ hỗ trợ ảnh JPG hoặc PNG.';
	if (file.size < 1) return 'Tệp ảnh trống.';
	if (file.size > MAX_UPLOAD_BYTES) return 'Ảnh quá lớn (tối đa 10 MB).';
	return null;
}

/** The upload target `POST /files` hands back (the response envelope's `data`). */
interface PresignedUpload {
	id: string;
	uploadUrl: string;
	formData?: Record<string, string>;
}

const withProtocol = (url: string): string => (/^https?:\/\//.test(url) ? url : `https://${url}`);

/**
 * Uploads a file to the public bucket and returns its file-service id, which is then attached
 * somewhere (a flash card's `imageFileId`, …). Public like avatars, so the URL the backend returns
 * for it does not expire. Until it is attached the file is an orphan, deleted after 24 h.
 */
export async function uploadPublicFile(file: File): Promise<string> {
	const res = await FilesService.fileGatewayControllerGetPresignedUrlV1({
		isPublicFile: true,
		fileName: file.name,
		fileSize: file.size,
		contentType: file.type,
	});
	const upload = ((res as { data?: unknown }).data ?? res) as PresignedUpload;
	const endpoint = withProtocol(upload.uploadUrl);

	let stored: Response;
	if (upload.formData && Object.keys(upload.formData).length > 0) {
		// S3-style POST policy: the signed fields first, the file last.
		const body = new FormData();
		for (const [key, value] of Object.entries(upload.formData)) body.append(key, value);
		body.append('file', file);
		stored = await fetch(endpoint, { method: 'POST', body: body });
	} else {
		stored = await fetch(endpoint, {
			method: 'PUT',
			body: file,
			headers: { 'Content-Type': file.type },
		});
	}
	if (!stored.ok) throw new Error(`Tải tệp lên thất bại (HTTP ${stored.status})`);
	return upload.id;
}
