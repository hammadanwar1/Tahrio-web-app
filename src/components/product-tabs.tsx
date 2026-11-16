'use client';

import { useState, type ReactNode } from 'react';

/**
 * Description / Specification / Reviews / Additional information tabs. Every panel is in the HTML
 * (hidden ones too), so search engines read all of it.
 */
export function ProductTabs({ tabs }: { tabs: { id: string; label: string; content: ReactNode }[] }) {
  const [active, setActive] = useState(tabs[0]?.id);
  return (
    <div>
      <div role="tablist" aria-label="Product information" className="scrollbar-none flex gap-1 overflow-x-auto border-b border-line">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            id={`tab-${t.id}`}
            aria-selected={active === t.id}
            aria-controls={`panel-${t.id}`}
            onClick={() => setActive(t.id)}
            className={`-mb-px shrink-0 border-b-[3px] px-4 py-3 text-sm font-bold uppercase tracking-wide transition-colors sm:px-6 ${
              active === t.id ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-ink'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tabs.map((t) => (
        <div key={t.id} role="tabpanel" id={`panel-${t.id}`} aria-labelledby={`tab-${t.id}`} hidden={active !== t.id} className="pt-6">
          {t.content}
        </div>
      ))}
    </div>
  );
}
