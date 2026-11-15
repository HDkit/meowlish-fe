import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const presign = vi.fn();
vi.mock('./api-client', () => ({
	FilesService: { fileGatewayControllerGetPresignedUrlV1: (body: unknown) => presign(body) },
}));

import { imageFileProblem, MAX_UPLOAD_BYTES, uploadPublicFile } from './file-upload';

describe('imageFileProblem', () => {
	it('accepts JPG and PNG up to 10 MB', () => {
		expect(imageFileProblem({ type: 'image/png', size: 1 })).toBeNull();
		expect(imageFileProblem({ type: 'image/jpeg', size: MAX_UPLOAD_BYTES })).toBeNull();
	});

	it('refuses other types, empty and oversized files', () => {
		expect(imageFileProblem({ type: 'image/gif', size: 10 })).toMatch(/JPG hoặc PNG/);
		expect(imageFileProblem({ type: 'application/pdf', size: 10 })).toMatch(/JPG hoặc PNG/);
		expect(imageFileProblem({ type: 'image/png', size: 0 })).toMatch(/trống/);
		expect(imageFileProblem({ type: 'image/png', size: MAX_UPLOAD_BYTES + 1 })).toMatch(/10 MB/);
	});
});

describe('uploadPublicFile', () => {
	const fetchMock = vi.fn();
	const file = new File(['png-bytes'], 'cat.png', { type: 'image/png' });

	beforeEach(() => {
		presign.mockReset();
		fetchMock.mockReset();
		fetchMock.mockResolvedValue({ ok: true, status: 204 });
		vi.stubGlobal('fetch', fetchMock);
	});
	afterEach(() => vi.unstubAllGlobals());

	it('presigns a public upload, posts the signed form with the file last, returns the id', async () => {
		presign.mockResolvedValue({
			data: { id: 'f1', uploadUrl: 'minio.local/public', formData: { key: 'f1', policy: 'p' } },
		});
		await expect(uploadPublicFile(file)).resolves.toBe('f1');
		expect(presign).toHaveBeenCalledWith({
			isPublicFile: true,
			fileName: 'cat.png',
			fileSize: file.size,
			contentType: 'image/png',
		});
		const [url, init] = fetchMock.mock.calls[0] as [string, { method: string; body: FormData }];
		expect(url).toBe('https://minio.local/public');
		expect(init.method).toBe('POST');
		expect([...init.body.keys()]).toEqual(['key', 'policy', 'file']);
	});

	it('PUTs to a presigned URL when there are no form fields', async () => {
		presign.mockResolvedValue({ id: 'f2', uploadUrl: 'http://s3/x?sig=1' });
		await expect(uploadPublicFile(file)).resolves.toBe('f2');
		expect(fetchMock).toHaveBeenCalledWith('http://s3/x?sig=1', {
			method: 'PUT',
			body: file,
			headers: { 'Content-Type': 'image/png' },
		});
	});

	it('fails when the storage refuses the upload', async () => {
		presign.mockResolvedValue({ data: { id: 'f3', uploadUrl: 'http://s3/x', formData: { a: 'b' } } });
		fetchMock.mockResolvedValue({ ok: false, status: 403 });
		await expect(uploadPublicFile(file)).rejects.toThrow('HTTP 403');
	});
});
