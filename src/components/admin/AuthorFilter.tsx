'use client';

import { useEffect, useState } from 'react';
import { Check, ChevronsUpDown, Loader2, UserRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { extractApiErrorMessage } from '@/lib/api-response';

/** null: every author; otherwise one author (id + display name for the button). */
export type AuthorSelection = { id: string; name: string } | null;

type Match = { id: string; name: string; username: string };

/** Username search over public profiles (GET /auth/identities-public, matches usernames only). */
const searchAuthors = async (query: string, signal: AbortSignal): Promise<Match[]> => {
	const qs = new URLSearchParams({ usernameOrCredIdentifier: query, limit: '8' });
	const res = await fetch(`/api/v1/auth/identities-public?${qs}`, { signal: signal, credentials: 'include' });
	const body = await res.json().catch(() => null);
	if (!res.ok) throw { status: res.status, body: body };
	const identities: unknown[] = body?.data?.identities ?? [];
	return identities.flatMap((i) => {
		const it = i as { id?: string; fullName?: string; username?: string };
		return it?.id ? [{ id: it.id, name: it.fullName || it.username || 'Người dùng', username: it.username ?? '' }] : [];
	});
};

/**
 * "Tác giả" filter for admin lists: every author, yourself, or anyone found by username.
 * Searches as you type (300 ms debounce); the parent filters on the server by author id.
 */
export function AuthorFilter({
	value,
	onChange,
	currentUser,
}: {
	value: AuthorSelection;
	onChange: (v: AuthorSelection) => void;
	currentUser: { id: string; name: string };
}) {
	const [open, setOpen] = useState(false);
	const [query, setQuery] = useState('');
	const [matches, setMatches] = useState<Match[]>([]);
	const [searching, setSearching] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const q = query.trim();
		if (!open || q.length === 0) {
			setMatches([]);
			setError(null);
			return;
		}
		const controller = new AbortController();
		const t = setTimeout(() => {
			setSearching(true);
			setError(null);
			searchAuthors(q, controller.signal)
				.then(setMatches)
				.catch((err) => {
					if ((err as { name?: string })?.name === 'AbortError') return;
					setError(extractApiErrorMessage(err, 'Không tìm được người dùng.'));
				})
				.finally(() => !controller.signal.aborted && setSearching(false));
		}, 300);
		return () => {
			clearTimeout(t);
			controller.abort();
		};
	}, [query, open]);

	const pick = (v: AuthorSelection) => {
		onChange(v);
		setOpen(false);
		setQuery('');
	};
	const label = !value ? 'Mọi tác giả' : value.id === currentUser.id ? 'Bài của tôi' : value.name;

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button variant="outline" role="combobox" aria-expanded={open} aria-label="Lọc theo tác giả" className="h-9 max-w-[16rem] justify-between gap-2">
					<UserRound className="h-4 w-4 shrink-0 text-muted-foreground" />
					<span className="truncate">{label}</span>
					<ChevronsUpDown className="h-3.5 w-3.5 shrink-0 opacity-50" />
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-[min(22rem,calc(100vw-2rem))] p-0" align="start">
				{/* results come from the server: cmdk must not filter them again */}
				<Command shouldFilter={false}>
					<CommandInput placeholder="Tìm theo tên đăng nhập…" value={query} onValueChange={setQuery} />
					<CommandList>
						<CommandGroup>
							<CommandItem value="__all__" onSelect={() => pick(null)} className="gap-2">
								<Check className={`h-4 w-4 ${!value ? 'opacity-100' : 'opacity-0'}`} /> Mọi tác giả
							</CommandItem>
							<CommandItem value="__me__" onSelect={() => pick(currentUser)} className="gap-2">
								<Check className={`h-4 w-4 ${value?.id === currentUser.id ? 'opacity-100' : 'opacity-0'}`} /> Bài của tôi
							</CommandItem>
						</CommandGroup>
						{query.trim() && (
							<CommandGroup heading="Người dùng">
								{searching && (
									<div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
										<Loader2 className="h-4 w-4 animate-spin" /> Đang tìm…
									</div>
								)}
								{error && <p className="px-3 py-2 text-sm text-destructive break-words">{error}</p>}
								{!searching && !error && matches.length === 0 && <CommandEmpty>Không tìm thấy người dùng.</CommandEmpty>}
								{matches.map((m) => (
									<CommandItem key={m.id} value={m.id} onSelect={() => pick({ id: m.id, name: m.name })} className="gap-2">
										<Check className={`h-4 w-4 shrink-0 ${value?.id === m.id ? 'opacity-100' : 'opacity-0'}`} />
										<span className="min-w-0 flex-1">
											<span className="block truncate font-medium">{m.name}</span>
											{m.username && <span className="block truncate text-xs text-muted-foreground">@{m.username}</span>}
										</span>
									</CommandItem>
								))}
							</CommandGroup>
						)}
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
}
