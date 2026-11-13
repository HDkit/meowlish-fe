'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { Bell, ChevronRight, KeyRound, Loader2, Moon, Palette, Sun, Trophy, Flag, Megaphone, UserRound } from 'lucide-react';
import { Switch } from './ui/switch';
import { Skeleton } from './ui/skeleton';
import { useToast } from './ui/use-toast';
import { useAppSelector, useIsStoreHydrated } from '@/lib/store/hooks';
import { NotificationService, type NotificationPreferences } from '@/lib/api/services/NotificationService';
import { extractApiErrorMessage } from '@/lib/api-response';

type PrefKey = 'achievementEnabled' | 'reportEnabled' | 'systemEnabled';

const NOTIFICATION_TYPES: { key: PrefKey; title: string; description: string; icon: typeof Bell }[] = [
	{
		key: 'achievementEnabled',
		title: 'Thành tích',
		description: 'Khi bạn nhận được huy hiệu mới hoặc giữ vững chuỗi ngày học.',
		icon: Trophy,
	},
	{
		key: 'reportEnabled',
		title: 'Báo cáo',
		description: 'Khi báo cáo bạn gửi được xử lý (với quản trị viên: khi có báo cáo mới cần duyệt).',
		icon: Flag,
	},
	{
		key: 'systemEnabled',
		title: 'Hệ thống',
		description: 'Thông báo chung về nền tảng, bảo trì và tính năng mới.',
		icon: Megaphone,
	},
];

const DEFAULT_PREFS: Record<PrefKey, boolean> = {
	achievementEnabled: true,
	reportEnabled: true,
	systemEnabled: true,
};

function Section({ icon: Icon, title, description, children }: {
	icon: typeof Bell;
	title: string;
	description: string;
	children: React.ReactNode;
}) {
	return (
		<section className="rounded-2xl border border-slate-200/70 bg-white/90 p-6 shadow-sm backdrop-blur">
			<div className="mb-5 flex items-start gap-3">
				<span className="rounded-xl bg-primary/10 p-2.5 text-primary">
					<Icon className="h-5 w-5" />
				</span>
				<div>
					<h2 className="text-lg font-bold text-slate-900">{title}</h2>
					<p className="text-sm text-slate-500">{description}</p>
				</div>
			</div>
			{children}
		</section>
	);
}

/** /settings: notification types, theme, and links to account settings. */
export function SettingsPage() {
	const router = useRouter();
	const { toast } = useToast();
	const { theme, setTheme } = useTheme();
	const currentUser = useAppSelector((state) => state.currUser.current);
	const isHydrated = useIsStoreHydrated();
	const [prefs, setPrefs] = useState<Record<PrefKey, boolean>>(DEFAULT_PREFS);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState<PrefKey | null>(null);
	const [loadError, setLoadError] = useState<string | null>(null);
	const [mounted, setMounted] = useState(false);

	useEffect(() => setMounted(true), []);

	useEffect(() => {
		if (isHydrated && !currentUser) router.push('/auth');
	}, [isHydrated, currentUser, router]);

	useEffect(() => {
		if (!currentUser) return;
		let cancelled = false;
		NotificationService.getPreferences()
			.then((res) => {
				const data = (res?.data ?? res) as Partial<NotificationPreferences> | undefined;
				if (cancelled || !data) return;
				setPrefs({
					achievementEnabled: data.achievementEnabled ?? true,
					reportEnabled: data.reportEnabled ?? true,
					systemEnabled: data.systemEnabled ?? true,
				});
			})
			.catch((err) => !cancelled && setLoadError(extractApiErrorMessage(err, 'Không tải được cài đặt thông báo.')))
			.finally(() => !cancelled && setLoading(false));
		return () => {
			cancelled = true;
		};
	}, [currentUser]);

	const toggle = async (key: PrefKey, value: boolean) => {
		const previous = prefs[key];
		setPrefs((p) => ({ ...p, [key]: value }));
		setSaving(key);
		try {
			await NotificationService.updatePreferences({ [key]: value });
		} catch (err) {
			setPrefs((p) => ({ ...p, [key]: previous }));
			toast({
				title: 'Không lưu được cài đặt',
				description: extractApiErrorMessage(err, 'Vui lòng thử lại.'),
				variant: 'destructive',
			});
		} finally {
			setSaving(null);
		}
	};

	return (
		<div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-10 sm:px-6">
			<header>
				<h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Cài đặt</h1>
				<p className="mt-1 text-slate-500">Chọn thông báo bạn muốn nhận và giao diện bạn thích.</p>
			</header>

			<Section icon={Bell} title="Thông báo" description="Bật hoặc tắt từng loại thông báo trong ứng dụng. Thay đổi được lưu ngay.">
				{loadError ?
					<p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 break-words">{loadError}</p>
				:	<ul className="divide-y divide-slate-100" aria-busy={loading} aria-label={loading ? 'Đang tải cài đặt thông báo…' : undefined}>
						{NOTIFICATION_TYPES.map(({ key, title, description, icon: Icon }) => (
							<li key={key} className="flex items-center gap-4 py-4 first:pt-0 last:pb-0">
								<Icon className="h-5 w-5 shrink-0 text-slate-400" />
								<label htmlFor={`pref-${key}`} className="min-w-0 flex-1 cursor-pointer">
									<span className="block font-semibold text-slate-800">{title}</span>
									<span className="block text-sm text-slate-500">{description}</span>
								</label>
								{saving === key && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
								{/* a placeholder until the saved value is known, so the switch doesn't flip after load */}
								{loading ?
									<Skeleton className="h-[1.15rem] w-8 shrink-0 rounded-full" />
								:	<Switch
										id={`pref-${key}`}
										checked={prefs[key]}
										disabled={saving !== null}
										onCheckedChange={(v) => void toggle(key, v)}
									/>
								}
							</li>
						))}
					</ul>
				}
			</Section>

			<Section icon={Palette} title="Giao diện" description="Chế độ sáng hoặc tối cho toàn bộ ứng dụng.">
				<div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="Chế độ giao diện">
					{([
						{ value: 'light', label: 'Sáng', icon: Sun },
						{ value: 'dark', label: 'Tối', icon: Moon },
					] as const).map(({ value, label, icon: Icon }) => {
						const active = mounted && (theme ?? 'light') === value;
						return (
							<button
								key={value}
								type="button"
								role="radio"
								aria-checked={active}
								onClick={() => setTheme(value)}
								className={`flex items-center justify-center gap-2 rounded-xl border-2 px-4 py-4 font-semibold transition-all ${
									active ? 'border-primary bg-primary/5 text-primary' : 'border-slate-200 text-slate-600 hover:border-primary/40'
								}`}
							>
								<Icon className="h-5 w-5" /> {label}
							</button>
						);
					})}
				</div>
			</Section>

			<Section icon={UserRound} title="Tài khoản" description="Hồ sơ, phương thức đăng nhập và mật khẩu.">
				<div className="space-y-2">
					{[
						{ label: 'Hồ sơ và mục tiêu học tập', icon: UserRound },
						{ label: 'Phương thức đăng nhập và mật khẩu', icon: KeyRound },
					].map(({ label, icon: Icon }) => (
						<button
							key={label}
							type="button"
							onClick={() => router.push('/user')}
							className="flex w-full items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-left font-medium text-slate-700 transition-colors hover:bg-slate-50"
						>
							<Icon className="h-4 w-4 text-slate-400" />
							<span className="flex-1">{label}</span>
							<ChevronRight className="h-4 w-4 text-slate-400" />
						</button>
					))}
				</div>
			</Section>
		</div>
	);
}
