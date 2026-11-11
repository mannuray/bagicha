import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { messageFor } from '../../lib/error-messages';
import { Button, Chip, Icon, Screen, TextField, formSubmit } from '../../ui';
import { useSession } from '../auth';
import { DistrictField } from './DistrictField';
import { ProfilePhoto } from './ProfilePhoto';
import { RegionChooser } from './RegionChooser';
import { regionById } from './regions';
import { useProfileForm } from './useProfileForm';

export function ProfileScreen() {
  const { t } = useTranslation();
  const { user } = useSession();
  const f = useProfileForm(user);

  if (!user) return null;
  const regionLabel = regionById(user.region_cluster);

  const premium = f.premium;
  const open = f.open;

  return (
    <Screen nav>
      <header className="px-4 pb-2 pt-6">
        <h1 className="font-headline text-xl font-bold text-primary">{t('profile.title')}</h1>
      </header>
      <main className="space-y-6 px-4">
        <section className="flex flex-col items-center space-y-3 text-center">
          <div className="relative">
            <ProfilePhoto avatarKey={user.avatar_key} />
            <button
              type="button"
              onClick={open}
              aria-label={t('profile.edit')}
              className="absolute -bottom-1 -right-1 flex h-11 w-11 items-center justify-center rounded-full bg-secondary text-on-secondary shadow-lg"
            >
              <Icon name="edit" className="text-lg" />
            </button>
          </div>
          <div className="space-y-0.5">
            <p className="font-headline text-2xl font-bold text-primary">{user.name ?? t('profile.noName')}</p>
            <p className="font-label text-xs font-medium tracking-wide text-on-surface-variant">{user.phone_number}</p>
          </div>
          <div className="relative flex w-full items-center justify-between overflow-hidden rounded-xl border border-secondary/10 bg-secondary-container/20 px-5 py-4">
            <div className="absolute left-0 top-0 h-full w-1 bg-secondary" aria-hidden />
            <div className="text-left">
              <p className="mb-0.5 font-label text-[10px] font-extrabold uppercase tracking-widest text-on-secondary-container">{t('profile.status')}</p>
              <p className="font-headline text-lg font-bold leading-tight text-on-secondary-fixed-variant">{user.badge_level}</p>
            </div>
            {/* TODO(sustenance-score): Stitch shows a "Sustenance score" here. users.ranking_points
                exists, but nothing awards points and the API doesn't return it; it needs the PRD's
                earning rules (organic practices, compost logs, community). Until then: the plan. */}
            <div className="text-right">
              <p className="mb-0.5 font-label text-[10px] font-extrabold uppercase tracking-widest text-on-secondary-container">{t('profile.plan')}</p>
              <p className="flex items-center justify-end gap-1 font-headline text-lg font-bold text-secondary">
                {premium ? t('profile.premium') : t('profile.free')}
                <Icon name="eco" filled className="text-sm" />
              </p>
            </div>
          </div>
        </section>

        {!f.editing ? (
          <div className="space-y-4">
            <Group title={t('profile.groups.journal')}>
              <Row icon="language" label={t('profile.language')} value={user.language_pref === 'hi' ? 'हिन्दी' : 'English'} onClick={open} />
            </Group>
            <Group title={t('profile.groups.subscriptions')}>
              <div className="flex min-h-11 items-center justify-between px-3 py-3">
                <span className="flex items-center gap-3">
                  <Icon name="star" className="text-secondary" />
                  <span className="font-body text-sm font-bold text-on-secondary-fixed-variant">{t('profile.premiumRow')}</span>
                </span>
                <span className="rounded-full bg-secondary/10 px-2 py-1 font-label text-[10px] font-black uppercase tracking-widest text-secondary">
                  {premium ? t('profile.active') : t('profile.free')}
                </span>
              </div>
            </Group>
            <Group title={t('profile.groups.sanctuary')}>
              <Row icon="public" label={t('profile.region')} value={regionLabel ? t(regionLabel.labelKey) : '—'} onClick={open} />
              <Row icon="map" label={t('profile.district')} value={user.district ?? '—'} onClick={open} />
            </Group>
          </div>
        ) : (
          <form onSubmit={formSubmit(f.save)} className="space-y-4 rounded-xl bg-surface-container-low p-4">
            <TextField label={t('profile.name')} value={f.name} onChange={(e) => f.setName(e.target.value)} />
            <DistrictField
              label={t('profile.district')}
              value={f.district}
              list={f.districts.data ?? []}
              error={f.needDistrict ? t('profile.needDistrict') : null}
              onChange={f.typeDistrict}
            />
            <RegionChooser district={f.district} knownLabel={f.knownLabel} picked={f.picked} onPick={f.setPicked} variant="chips" />
            <div className="flex gap-2">
              <Chip selected={f.lang === 'en'} onClick={() => f.setLang('en')}>English</Chip>
              <Chip selected={f.lang === 'hi'} onClick={() => f.setLang('hi')}>हिन्दी</Chip>
            </div>
            {f.error && (
              <p role="alert" className="font-body text-sm text-error">
                {messageFor(f.error, t)}
              </p>
            )}
            <div className="flex gap-3">
              <Button type="submit" busy={f.busy}>
                {t('common.save')}
              </Button>
              <Button variant="tertiary" onClick={f.close}>
                {t('common.cancel')}
              </Button>
            </div>
          </form>
        )}

        <div className="flex justify-center pt-2">
          <button
            type="button"
            onClick={f.signOut}
            className="min-h-11 px-6 font-label text-[11px] font-extrabold uppercase tracking-[0.2em] text-on-surface-variant transition-colors hover:text-secondary"
          >
            {t('profile.signOut')}
          </button>
        </div>
        {/* The district map's licence (ODbL) asks for this credit. */}
        <p className="pb-4 text-center font-label text-[11px] text-outline">{t('profile.attribution')}</p>
      </main>
    </Screen>
  );
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-0.5 rounded-xl bg-surface-container-low p-1.5">
      <h2 className="px-3 py-2 font-headline text-base font-bold text-primary/80">{title}</h2>
      {children}
    </section>
  );
}

function Row({ icon, label, value, onClick }: { icon: string; label: string; value: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex min-h-11 w-full items-center justify-between rounded-lg px-3 py-3 transition-colors hover:bg-surface-container"
    >
      <span className="flex items-center gap-3">
        <Icon name={icon} className="text-primary/60 group-hover:text-primary" />
        <span className="font-body text-sm font-bold tracking-tight text-on-surface">{label}</span>
      </span>
      <span className="flex items-center gap-1">
        <span className="font-body text-xs font-medium text-on-surface-variant">{value}</span>
        <Icon name="chevron_right" className="text-lg text-outline-variant" />
      </span>
    </button>
  );
}
