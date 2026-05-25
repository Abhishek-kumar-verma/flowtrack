/**
 * LoadingSkeleton – pulsing placeholder cards (theme-aware).
 *
 * Props:
 *   count  – number of skeleton cards to render (default 3)
 *   height – additional height class (default 'h-36')
 */
export default function LoadingSkeleton({ count = 3, height = 'h-36' }) {
  return (
    <div className="flex flex-col gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`w-full ${height} rounded-2xl bg-slate-100 dark:bg-dark-800 border border-slate-200 dark:border-dark-600/50 overflow-hidden relative`}
        >
          <div className="p-5 flex flex-col gap-3 h-full">
            {/* top badges row */}
            <div className="flex items-center gap-3">
              <div className="h-5 w-16 rounded-full bg-slate-200 dark:bg-dark-600 animate-pulse" />
              <div className="h-5 w-20 rounded-full bg-slate-200 dark:bg-dark-600 animate-pulse" />
              <div className="ml-auto h-5 w-24 rounded-full bg-slate-200 dark:bg-dark-600 animate-pulse" />
            </div>
            {/* title */}
            <div className="h-5 w-2/3 rounded bg-slate-200 dark:bg-dark-600 animate-pulse" />
            {/* description lines */}
            <div className="h-4 w-full rounded bg-slate-100 dark:bg-dark-700 animate-pulse" />
            <div className="h-4 w-4/5 rounded bg-slate-100 dark:bg-dark-700 animate-pulse" />
            {/* footer */}
            <div className="mt-auto flex items-center gap-3">
              <div className="h-4 w-20 rounded-full bg-slate-200 dark:bg-dark-600 animate-pulse" />
              <div className="ml-auto h-7 w-24 rounded-lg bg-slate-200 dark:bg-dark-600 animate-pulse" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
