import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

const base = (props: IconProps) => ({
  width: 18,
  height: 18,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  ...props,
});

export const HomeIcon = (p: IconProps) => (
  <svg {...base(p)}><path d="M3 11.5 12 4l9 7.5" /><path d="M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9" /></svg>
);
export const DashboardIcon = (p: IconProps) => (
  <svg {...base(p)}><path d="M4 20V10" /><path d="M10 20V4" /><path d="M16 20v-7" /><path d="M22 20H2" /></svg>
);
export const DropletIcon = (p: IconProps) => (
  <svg {...base(p)}><path d="M12 3s7 7.2 7 12a7 7 0 0 1-14 0c0-4.8 7-12 7-12Z" /></svg>
);
export const LeafIcon = (p: IconProps) => (
  <svg {...base(p)}><path d="M4 15c0-6.5 5.5-11 15-11 0 9.5-4.5 15-11 15-2 0-4-1-4-4Z" /><path d="M8 20c2-3 5-7 11-11" /></svg>
);
export const GearIcon = (p: IconProps) => (
  <svg {...base(p)}><circle cx="12" cy="12" r="3.2" /><path d="M19.4 13.5c.06-.5.06-1 0-1.5l1.9-1.5-2-3.4-2.2.6a7.5 7.5 0 0 0-1.3-.8l-.4-2.3H9.6l-.4 2.3c-.47.2-.9.47-1.3.8l-2.2-.6-2 3.4L5.6 12c-.06.5-.06 1 0 1.5l-1.9 1.5 2 3.4 2.2-.6c.4.33.83.6 1.3.8l.4 2.3h4.8l.4-2.3c.47-.2.9-.47 1.3-.8l2.2.6 2-3.4-1.9-1.5Z" /></svg>
);
export const BellIcon = (p: IconProps) => (
  <svg {...base(p)}><path d="M6 9a6 6 0 1 1 12 0c0 4 1.5 5.5 1.5 5.5h-15S6 13 6 9Z" /><path d="M9.5 17.5a2.5 2.5 0 0 0 5 0" /></svg>
);
export const UserCircleIcon = (p: IconProps) => (
  <svg {...base(p)}><circle cx="12" cy="12" r="9" /><circle cx="12" cy="10" r="3" /><path d="M6.2 18.2a6 6 0 0 1 11.6 0" /></svg>
);
export const SearchIcon = (p: IconProps) => (
  <svg {...base(p)}><circle cx="11" cy="11" r="7" /><path d="m20 20-3-3" /></svg>
);
export const EditIcon = (p: IconProps) => (
  <svg {...base(p)}><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>
);
export const TrashIcon = (p: IconProps) => (
  <svg {...base(p)}><path d="M3 6h18" /><path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" /><path d="M19 6l-1 14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /></svg>
);
export const ChevronLeftIcon = (p: IconProps) => (
  <svg {...base(p)}><path d="m15 18-6-6 6-6" /></svg>
);
export const ChevronRightIcon = (p: IconProps) => (
  <svg {...base(p)}><path d="m9 18 6-6-6-6" /></svg>
);
export const ChevronDownIcon = (p: IconProps) => (
  <svg {...base(p)}><path d="m6 9 6 6 6-6" /></svg>
);
export const PlayIcon = (p: IconProps) => (
  <svg {...base(p)} fill="currentColor" stroke="none"><path d="M7 4.5v15l13-7.5-13-7.5Z" /></svg>
);
export const StopIcon = (p: IconProps) => (
  <svg {...base(p)} fill="currentColor" stroke="none"><rect x="6" y="6" width="12" height="12" rx="1.5" /></svg>
);
export const AutoIcon = (p: IconProps) => (
  <svg {...base(p)}><path d="M12 4v3" /><path d="m5.6 6.6 2 2" /><path d="M4 13h3" /><path d="m5.6 19.4 2-2" /><path d="M12 21v-3" /><path d="m18.4 19.4-2-2" /><path d="M20 13h-3" /><path d="m18.4 6.6-2 2" /><circle cx="12" cy="13" r="3" /></svg>
);
export const HandIcon = (p: IconProps) => (
  <svg {...base(p)}><path d="M8 12V5.5a1.5 1.5 0 0 1 3 0V11" /><path d="M11 10.5v-2a1.5 1.5 0 0 1 3 0V11" /><path d="M14 10.5a1.5 1.5 0 0 1 3 0V12" /><path d="M17 12V11a1.5 1.5 0 0 1 3 0v4a6 6 0 0 1-6 6h-1a6 6 0 0 1-5.2-3l-2.4-4.2a1.4 1.4 0 0 1 2.3-1.6L9 15" /></svg>
);
export const ClockIcon = (p: IconProps) => (
  <svg {...base(p)}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3.5 2" /></svg>
);
export const ChartLineIcon = (p: IconProps) => (
  <svg {...base(p)}><path d="M4 19h16" /><path d="M4 19V5" /><path d="m4 15 4-4 3 3 5-6" /></svg>
);
export const InfoBoxIcon = (p: IconProps) => (
  <svg {...base(p)}><rect x="4" y="4" width="16" height="16" rx="2" /><path d="M8 9h8M8 13h5" /></svg>
);
export const CalendarIcon = (p: IconProps) => (
  <svg {...base(p)}><rect x="3.5" y="5" width="17" height="16" rx="2" /><path d="M8 3v4M16 3v4M3.5 10h17" /></svg>
);
export const StatsIcon = (p: IconProps) => (
  <svg {...base(p)}><path d="M4 4v16h16" /><path d="M7 15v3M11 11v7M15 8v10M19 5v13" /></svg>
);
export const HealthyIcon = (p: IconProps) => (
  <svg {...base(p)}><circle cx="12" cy="12" r="9" /><path d="m8.2 12.3 2.4 2.5 5.2-5.6" /></svg>
);
export const DocumentIcon = (p: IconProps) => (
  <svg {...base(p)}><path d="M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" /><path d="M14 3v5h5" /></svg>
);
export const ListIcon = (p: IconProps) => (
  <svg {...base(p)}><rect x="4" y="4" width="16" height="16" rx="2" /><path d="M8 9h8M8 13h8M8 17h5" /></svg>
);
export const WifiIcon = (p: IconProps) => (
  <svg {...base(p)}><path d="M4 9a12 12 0 0 1 16 0" /><path d="M7.2 12.6a8 8 0 0 1 9.6 0" /><path d="M10 16a4 4 0 0 1 4 0" /><circle cx="12" cy="19" r="1" fill="currentColor" stroke="none" /></svg>
);
export const GridIcon = (p: IconProps) => (
  <svg {...base(p)}><rect x="4" y="4" width="7" height="7" rx="1.5" /><rect x="13" y="4" width="7" height="7" rx="1.5" /><rect x="4" y="13" width="7" height="7" rx="1.5" /><rect x="13" y="13" width="7" height="7" rx="1.5" /></svg>
);
export const ThemeOffIcon = (p: IconProps) => (
  <svg {...base(p)}><circle cx="12" cy="12" r="9" /><path d="m5 5 14 14" /></svg>
);
export const MoonIcon = (p: IconProps) => (
  <svg {...base(p)}><path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5Z" /></svg>
);
export const SunIcon = (p: IconProps) => (
  <svg {...base(p)}><circle cx="12" cy="12" r="4.2" /><path d="M12 3v2M12 19v2M5 5l1.4 1.4M17.6 17.6 19 19M3 12h2M19 12h2M5 19l1.4-1.4M17.6 6.4 19 5" /></svg>
);
export const ShieldIcon = (p: IconProps) => (
  <svg {...base(p)}><path d="M12 3 5 6v6c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V6l-7-3Z" /></svg>
);
export const LockIcon = (p: IconProps) => (
  <svg {...base(p)}><rect x="5" y="10.5" width="14" height="9.5" rx="1.5" /><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" /></svg>
);
export const LogoutIcon = (p: IconProps) => (
  <svg {...base(p)}><path d="M10 4H6a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h4" /><path d="M15 16l4-4-4-4" /><path d="M19 12H9" /></svg>
);
export const MailIcon = (p: IconProps) => (
  <svg {...base(p)}><rect x="3.5" y="5.5" width="17" height="13" rx="2" /><path d="m4 6.5 8 6.5 8-6.5" /></svg>
);
export const PhoneIcon = (p: IconProps) => (
  <svg {...base(p)}><rect x="7" y="2.5" width="10" height="19" rx="2" /><path d="M11 18.5h2" /></svg>
);
export const EyeIcon = (p: IconProps) => (
  <svg {...base(p)}><path d="M2 12s3.5-6.5 10-6.5S22 12 22 12s-3.5 6.5-10 6.5S2 12 2 12Z" /><circle cx="12" cy="12" r="2.6" /></svg>
);
export const EyeOffIcon = (p: IconProps) => (
  <svg {...base(p)}><path d="M3 3l18 18" /><path d="M10.6 5.6A10.6 10.6 0 0 1 12 5.5c6.5 0 10 6.5 10 6.5a15.6 15.6 0 0 1-3.4 4.2M6.6 6.6C4 8.3 2 12 2 12s3.5 6.5 10 6.5c1.3 0 2.5-.2 3.5-.6" /><path d="M9.9 9.9a2.6 2.6 0 0 0 3.7 3.7" /></svg>
);
export const CheckIcon = (p: IconProps) => (
  <svg {...base(p)}><path d="m5 12 5 5 9-11" /></svg>
);
export const WarningIcon = (p: IconProps) => (
  <svg {...base(p)}><path d="M12 3.5 21.5 20h-19L12 3.5Z" /><path d="M12 10v4" /><path d="M12 17.2h.01" /></svg>
);
export const ArrowRightIcon = (p: IconProps) => (
  <svg {...base(p)}><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></svg>
);
export const ArrowUpIcon = (p: IconProps) => (
  <svg {...base(p)}><path d="M12 19V5" /><path d="m6 11 6-6 6 6" /></svg>
);
