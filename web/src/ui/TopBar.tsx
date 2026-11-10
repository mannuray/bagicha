import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Icon } from './Icon';

/** Floating back button plus an optional serif title. */
export function TopBar({ title, back = true }: { title?: string; back?: boolean }) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  return (
    <div className="flex items-center gap-4 px-6 pt-6">
      {back && (
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label={t('common.back')}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-surface/80 text-primary shadow-[0_4px_20px_rgba(28,28,25,0.08)] backdrop-blur-xl"
        >
          <Icon name="arrow_back" />
        </button>
      )}
      {title && <h1 className="font-headline text-2xl text-primary">{title}</h1>}
    </div>
  );
}
