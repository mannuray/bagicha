import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { Screen } from '../ui';

export function NotFoundScreen() {
  const { t } = useTranslation();
  return (
    <Screen>
      <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-5 text-center">
        <h1 className="font-headline text-2xl text-primary">{t('app.notFound')}</h1>
        <Link to="/" className="bg-primary-gradient inline-flex min-h-11 items-center rounded-full px-4 font-label text-sm font-bold text-on-primary">
          {t('app.home')}
        </Link>
      </main>
    </Screen>
  );
}
