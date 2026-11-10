import { NavLink } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Icon } from './Icon';
import { cx } from './cx';

const TABS = [
  { to: '/', icon: 'eco', labelKey: 'nav.home', end: true },
  { to: '/plants', icon: 'park', labelKey: 'nav.plants', end: false },
  { to: '/scan', icon: 'photo_camera', labelKey: 'nav.scan', end: false },
  { to: '/profile', icon: 'person', labelKey: 'nav.profile', end: false },
] as const;

/** Glass bottom navigation; the active tab is a forest-gradient pebble. */
export function BottomNav() {
  const { t } = useTranslation();
  return (
    <nav
      aria-label={t('nav.label')}
      className="glass-panel fixed bottom-0 left-1/2 z-50 w-full max-w-[480px] -translate-x-1/2 rounded-t-[1.75rem] px-3 pb-3 pt-2 shadow-[0_-10px_40px_rgba(28,28,25,0.06)]"
    >
      <ul className="flex items-center justify-around">
        {TABS.map((tab) => (
          <li key={tab.to}>
            <NavLink
              to={tab.to}
              end={tab.end}
              className={({ isActive }) =>
                cx(
                  'flex min-h-11 flex-col items-center justify-center rounded-[1.5rem] px-4 py-1 transition-colors',
                  isActive ? 'bg-primary-gradient text-on-primary shadow-lg' : 'text-primary/60',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon name={tab.icon} filled={isActive} className="text-[22px]" />
                  <span className="font-label text-[10px] font-semibold uppercase tracking-widest">{t(tab.labelKey)}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
