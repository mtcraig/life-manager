const ICON_PROPS = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  className: 'h-4 w-4 shrink-0',
  'aria-hidden': true,
};

export function HomeIcon() {
  return (
    <svg {...ICON_PROPS}>
      <path d="M4 11.5 12 4l8 7.5" />
      <path d="M6 10v9a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-9" />
      <path d="M10 20v-6h4v6" />
    </svg>
  );
}

export function AccountsIcon() {
  return (
    <svg {...ICON_PROPS}>
      <path d="M3 7a2 2 0 0 1 2-2h11l4 4v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
      <path d="M16 12h3" />
    </svg>
  );
}

export function DetailIcon() {
  return (
    <svg {...ICON_PROPS}>
      <path d="M4 6h16M4 12h16M4 18h10" />
    </svg>
  );
}

export function WealthIcon() {
  return (
    <svg {...ICON_PROPS}>
      <path d="M4 19V9M11 19V5M18 19v-7" />
    </svg>
  );
}

export function InvestmentsIcon() {
  return (
    <svg {...ICON_PROPS}>
      <path d="m4 15 5-6 4 4 7-9" />
      <path d="M14 4h6v6" />
    </svg>
  );
}

export function InsuranceIcon() {
  return (
    <svg {...ICON_PROPS}>
      <path d="M12 3 5 6v6c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V6Z" />
      <path d="m9.5 12 1.8 1.8L14.5 10" />
    </svg>
  );
}

export function EnergyIcon() {
  return (
    <svg {...ICON_PROPS}>
      <path d="M13 3 5 14h6l-1 7 9-12h-6z" />
    </svg>
  );
}

export function ContentsIcon() {
  return (
    <svg {...ICON_PROPS}>
      <path d="M3 8h18v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1Z" />
      <path d="M3 8V5a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v3" />
      <path d="M10 12h4" />
    </svg>
  );
}

export function SettingsIcon() {
  return (
    <svg {...ICON_PROPS}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1 1.55V21a2 2 0 1 1-4 0v-.09A1.7 1.7 0 0 0 9 19.4a1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.55-1H3a2 2 0 1 1 0-4h.09A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.55V3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1 1.55 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9a1.7 1.7 0 0 0 1.55 1H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.55 1Z" />
    </svg>
  );
}
