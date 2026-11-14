'use client';

import { useState } from 'react';
import { Languages, Loader2 } from 'lucide-react';
import { appendTranslation, translateToVietnamese } from '@/lib/translate';

/**
 * "Dịch nghĩa": translates `source` (the card's word) and ADDS the result to the definition
 * through `onAppend`, so whatever the user already wrote stays.
 */
export function TranslateButton({
	source,
	definition,
	onChange,
}: {
	source: string;
	definition: string;
	onChange: (next: string) => void;
}) {
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState('');
	const disabled = busy || !source.trim();

	const run = async () => {
		setBusy(true);
		setError('');
		try {
			const t = await translateToVietnamese(source);
			onChange(appendTranslation(definition, t));
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Không dịch được, vui lòng thử lại.');
		} finally {
			setBusy(false);
		}
	};

	return (
		<span className="inline-flex items-center gap-2">
			{error && (
				<span role="alert" className="text-xs text-red-600">
					{error}
				</span>
			)}
			<button
				type="button"
				onClick={() => void run()}
				disabled={disabled}
				title={source.trim() ? `Dịch “${source.trim()}” sang tiếng Việt và thêm vào định nghĩa` : 'Nhập từ trước để dịch'}
				className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-semibold text-primary hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-50"
			>
				{busy ?
					<Loader2 className="h-3.5 w-3.5 animate-spin motion-reduce:animate-none" aria-hidden />
				:	<Languages className="h-3.5 w-3.5" aria-hidden />}
				Dịch nghĩa
			</button>
		</span>
	);
}
