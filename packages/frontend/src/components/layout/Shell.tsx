import { NavLink, Outlet } from 'react-router-dom';
import { ThemeToggle } from './ThemeToggle.js';
import { ServerStatus } from './ServerStatus.js';
import { ExitButton } from './ExitButton.js';
import {
  AccountsIcon,
  BudgetsIcon,
  ContentsIcon,
  DetailIcon,
  EnergyIcon,
  HomeIcon,
  InsuranceIcon,
  InvestmentsIcon,
  SettingsIcon,
  SubscriptionsIcon,
  WealthIcon,
} from './NavIcons.js';

const NAV_ITEMS = [
  { to: '/', label: 'Home', end: true, icon: HomeIcon },
  { to: '/accounts', label: 'Accounts', icon: AccountsIcon },
  { to: '/detail', label: 'Detail', icon: DetailIcon },
  { to: '/wealth', label: 'Wealth', icon: WealthIcon },
  { to: '/budgets', label: 'Budgets', icon: BudgetsIcon },
  { to: '/subscriptions', label: 'Subscriptions', icon: SubscriptionsIcon },
  { to: '/investments', label: 'Investments', icon: InvestmentsIcon },
  { to: '/insurance', label: 'Insurance', icon: InsuranceIcon },
  { to: '/energy', label: 'Energy', icon: EnergyIcon },
  { to: '/contents', label: 'Contents', icon: ContentsIcon },
  { to: '/settings', label: 'Settings', icon: SettingsIcon },
];

export function Shell() {
  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
      <nav className="flex w-48 shrink-0 flex-col border-r border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-6 flex items-center gap-2">
          <svg viewBox="0 0 64 64" className="h-6 w-6 shrink-0" aria-hidden="true">
            <rect width="64" height="64" rx="14" className="fill-slate-900 dark:fill-slate-100" />
            <path
              d="M32 14 L50 29 V48 a2 2 0 0 1-2 2 H16 a2 2 0 0 1-2-2 V29 Z"
              fill="none"
              className="stroke-white dark:stroke-slate-900"
              strokeWidth="3.5"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            <rect x="27" y="36" width="10" height="14" className="fill-white dark:fill-slate-900" />
          </svg>
          <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Life <span className="text-teal-700 dark:text-teal-400">Manager</span>
          </span>
        </div>
        <ul className="flex-1 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium ${
                    isActive
                      ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                      : 'flair-underline text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
                  }`
                }
              >
                <item.icon />
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
        <ThemeToggle />
        <ServerStatus />
        <ExitButton />
      </nav>
      <main className="flex-1 overflow-y-auto p-8">
        <Outlet />
      </main>
    </div>
  );
}
