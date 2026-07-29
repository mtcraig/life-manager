import { NavLink, Outlet } from 'react-router-dom';

const NAV_ITEMS = [
  { to: '/', label: 'Home', end: true },
  { to: '/accounts', label: 'Accounts' },
  { to: '/detail', label: 'Detail' },
  { to: '/wealth', label: 'Wealth' },
  { to: '/investments', label: 'Investments' },
  { to: '/insurance', label: 'Insurance' },
  { to: '/energy', label: 'Energy' },
  { to: '/contents', label: 'Contents' },
  { to: '/settings', label: 'Settings' },
];

export function Shell() {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <nav className="w-48 shrink-0 border-r border-slate-200 bg-white p-4">
        <div className="mb-6 text-lg font-bold text-slate-900">Life Manager</div>
        <ul className="space-y-1">
          {NAV_ITEMS.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `block rounded-md px-3 py-2 text-sm font-medium ${
                    isActive ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                  }`
                }
              >
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <main className="flex-1 p-8">
        <Outlet />
      </main>
    </div>
  );
}
