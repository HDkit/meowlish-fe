import {
  BookA,
  BriefcaseBusiness,
  CircleHelp,
  Coffee,
  GraduationCap,
  HeartHandshake,
  Megaphone,
  MessagesSquare,
  type LucideIcon,
} from 'lucide-react';

export interface CategoryStyle {
  icon: LucideIcon;
  /** Tailwind classes for the icon tile. */
  tile: string;
}

const STYLES: Record<string, CategoryStyle> = {
  'thong-bao': { icon: Megaphone, tile: 'bg-amber-50 text-amber-600 ring-amber-100' },
  ielts: { icon: GraduationCap, tile: 'bg-sky-50 text-sky-600 ring-sky-100' },
  toeic: { icon: BriefcaseBusiness, tile: 'bg-indigo-50 text-indigo-600 ring-indigo-100' },
  'ngu-phap-tu-vung': { icon: BookA, tile: 'bg-violet-50 text-violet-600 ring-violet-100' },
  'hoi-dap': { icon: CircleHelp, tile: 'bg-emerald-50 text-emerald-600 ring-emerald-100' },
  'goc-chia-se': { icon: HeartHandshake, tile: 'bg-rose-50 text-rose-600 ring-rose-100' },
  'off-topic': { icon: Coffee, tile: 'bg-orange-50 text-orange-600 ring-orange-100' },
};

const DEFAULT_STYLE: CategoryStyle = { icon: MessagesSquare, tile: 'bg-slate-50 text-slate-600 ring-slate-100' };

export const categoryStyle = (id: string): CategoryStyle => STYLES[id] ?? DEFAULT_STYLE;
