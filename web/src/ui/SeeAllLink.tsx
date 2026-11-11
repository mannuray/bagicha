import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { Icon } from './Icon';

/** "See all ›" as a small terracotta pill, so it reads as a button and never hugs the card edge. */
export function SeeAllLink({ to }: { to: string }) {
  const { t } = useTranslation();
  return (
    <Link
      to={to}
      className="inline-flex min-h-9 shrink-0 items-center gap-0.5 rounded-full bg-secondary/10 py-1 pl-3 pr-2 font-label text-xs font-bold uppercase tracking-wider text-secondary transition-colors hover:bg-secondary/15"
    >
      {t('common.seeAll')}
      <Icon name="chevron_right" className="text-base" />
    </Link>
  );
}
