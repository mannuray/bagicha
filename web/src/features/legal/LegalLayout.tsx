import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { BagichaLogo } from '../../ui';

/**
 * The frame for the privacy policy and terms: a plain readable column with the
 * Budtale header. The text is English only for now (it is a legal draft).
 */
export function LegalLayout({ title, lead, children }: { title: string; lead: string; children: ReactNode }) {
  const { t } = useTranslation();
  return (
    <div className="min-h-dvh bg-surface pb-[env(safe-area-inset-bottom)] text-on-surface" lang="en">
      <header className="bg-surface-container-low pt-[env(safe-area-inset-top)]">
        <div className="mx-auto flex max-w-3xl items-center gap-2.5 px-4 py-3">
          <Link to="/" className="flex items-center gap-2.5">
            <BagichaLogo size={32} />
            <span className="font-headline text-xl font-bold text-primary">{t('app.name')}</span>
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl space-y-5 px-4 py-10">
        <h1 className="font-headline text-3xl font-bold text-primary md:text-4xl">{title}</h1>
        <p className="font-body text-lg leading-relaxed text-on-surface">{lead}</p>
        {children}
        <nav className="flex flex-wrap gap-6 pt-8 font-label text-sm font-bold text-secondary">
          <Link to="/">{t('app.name')}</Link>
          <Link to="/privacy">{t('landing.privacy')}</Link>
          <Link to="/terms">{t('landing.terms')}</Link>
        </nav>
      </main>
    </div>
  );
}

export const H2 = ({ children }: { children: ReactNode }) => (
  <h2 className="pt-4 font-headline text-xl font-bold text-primary md:text-2xl">{children}</h2>
);

export const P = ({ children }: { children: ReactNode }) => (
  <p className="font-body text-base leading-relaxed text-on-surface">{children}</p>
);

export const List = ({ items }: { items: ReactNode[] }) => (
  <ul className="list-disc space-y-2 pl-6 font-body text-base leading-relaxed text-on-surface">
    {items.map((item, i) => (
      <li key={i}>{item}</li>
    ))}
  </ul>
);

export function Table({ head, rows }: { head: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto rounded-2xl bg-surface-container-low">
      <table className="w-full min-w-[560px] text-left font-body text-sm">
        <thead>
          <tr>
            {head.map((h) => (
              <th key={h} scope="col" className="px-4 py-3 font-label font-bold text-primary">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row[0]} className="odd:bg-surface-container-lowest/60">
              {row.map((cell, i) => (
                <td key={i} className="px-4 py-3 align-top text-on-surface">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
