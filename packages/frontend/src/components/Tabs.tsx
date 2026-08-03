import { BTN_ROW_ACTION } from '../theme/tokens.js';

export interface TabOption<T extends string> {
  value: T;
  label: string;
}

export function Tabs<T extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: TabOption<T>[];
  active: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex gap-2">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          type="button"
          onClick={() => onChange(tab.value)}
          className={
            active === tab.value
              ? 'rounded-md bg-slate-900 px-3 py-1 text-xs font-medium text-white dark:bg-slate-100 dark:text-slate-900'
              : BTN_ROW_ACTION
          }
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
