import type { NavTab } from '../ui';

/** The app's main sections, in bottom-navigation order. */
export const APP_TABS: readonly NavTab[] = [
  { to: '/', icon: 'eco', labelKey: 'nav.home', end: true },
  { to: '/plants', icon: 'park', labelKey: 'nav.plants', end: false },
  { to: '/scan', icon: 'photo_camera', labelKey: 'nav.scan', end: false },
  { to: '/profile', icon: 'person', labelKey: 'nav.profile', end: false },
];
