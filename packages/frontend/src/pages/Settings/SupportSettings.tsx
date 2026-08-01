import { Coffee } from 'lucide-react';

const GITHUB_REPO_URL = 'https://github.com/mtcraig/life-manager';

/** lucide-react ships generic icons only (GitBranch, GitFork, …), no brand marks —
 *  this is the standard GitHub "Octocat" logo mark, inlined since it's a real logo, not
 *  a generic glyph a generic icon set would carry. */
function GithubLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 .5C5.73.5.5 5.73.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56 0-.28-.01-1.02-.02-2-3.2.7-3.88-1.54-3.88-1.54-.52-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.76 2.7 1.25 3.36.96.1-.75.4-1.25.73-1.54-2.55-.29-5.23-1.28-5.23-5.68 0-1.25.45-2.28 1.19-3.08-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.79 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.24 2.76.12 3.05.74.8 1.19 1.83 1.19 3.08 0 4.41-2.69 5.38-5.25 5.67.41.36.78 1.06.78 2.14 0 1.55-.01 2.79-.01 3.17 0 .31.21.68.8.56A10.52 10.52 0 0 0 23.5 12C23.5 5.73 18.27.5 12 .5Z" />
    </svg>
  );
}

export function SupportSettings() {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-100">Support this project</h3>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <a
          href={GITHUB_REPO_URL}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-3 rounded-lg border border-slate-300 bg-slate-50 px-4 py-4 text-slate-900 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
        >
          <GithubLogo className="h-8 w-8 shrink-0" />
          <span>
            <span className="block font-medium">View on GitHub</span>
            <span className="block text-xs text-slate-500 dark:text-slate-400">
              Star the repo, report an issue, or contribute
            </span>
          </span>
        </a>
        <button
          type="button"
          disabled
          title="Coming soon"
          className="flex items-center gap-3 rounded-lg border border-slate-300 bg-slate-50 px-4 py-4 text-left text-slate-900 opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        >
          <Coffee className="h-8 w-8 shrink-0" />
          <span>
            <span className="block font-medium">Buy me a coffee</span>
            <span className="block text-xs text-slate-500 dark:text-slate-400">Ko-fi link coming soon</span>
          </span>
        </button>
      </div>
    </section>
  );
}
