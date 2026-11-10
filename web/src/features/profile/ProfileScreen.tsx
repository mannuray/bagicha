import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { messageFor } from '../../lib/error-messages';
import { Button, Chip, Icon, Screen, Surface, TextField } from '../../ui';
import { useSession, type RegionCluster } from '../auth';
import { useUpdateProfile } from './api';
import { REGIONS } from './regions';

export function ProfileScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, signOut } = useSession();
  const update = useUpdateProfile();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name ?? '');
  const [district, setDistrict] = useState(user?.district ?? '');
  const [region, setRegion] = useState<RegionCluster | null>(user?.region_cluster ?? null);
  const [lang, setLang] = useState(user?.language_pref ?? 'en');
  const [needDistrict, setNeedDistrict] = useState(false);

  if (!user) return null;
  const regionLabel = REGIONS.find((r) => r.id === user.region_cluster);

  const save = (event: FormEvent) => {
    event.preventDefault();
    // A profile without a district is incomplete and would bounce the user back to onboarding.
    if (!district.trim()) {
      setNeedDistrict(true);
      return;
    }
    update.mutate(
      { name: name.trim() || null, district: district.trim(), region_cluster: region, language_pref: lang },
      { onSuccess: () => setEditing(false) },
    );
  };

  return (
    <Screen nav>
      <header className="px-6 pb-6 pt-10">
        <p className="font-label text-xs font-bold uppercase tracking-widest text-secondary">{t('profile.kicker')}</p>
        <h1 className="font-headline text-4xl text-primary">{t('profile.title')}</h1>
      </header>
      <main className="space-y-6 px-6">
        <Surface className="flex items-center gap-5 p-6">
          <div className="pebble-large flex h-16 w-16 items-center justify-center bg-primary-gradient text-on-primary">
            <Icon name="person" filled className="text-3xl" />
          </div>
          <div>
            <p className="font-headline text-2xl text-primary">{user.name ?? t('profile.noName')}</p>
            <p className="font-body text-sm text-on-surface-variant">{user.phone_number}</p>
            <p className="mt-1 font-label text-[11px] font-bold uppercase tracking-widest text-secondary">{user.badge_level}</p>
          </div>
        </Surface>

        {!editing ? (
          <Surface className="space-y-4 p-6">
            <Row label={t('profile.region')} value={regionLabel ? t(regionLabel.labelKey) : '—'} />
            <Row label={t('profile.district')} value={user.district ?? '—'} />
            <Row label={t('profile.language')} value={user.language_pref === 'hi' ? 'हिन्दी' : 'English'} />
            <Button variant="tertiary" onClick={() => setEditing(true)}>
              <Icon name="edit" />
              {t('profile.edit')}
            </Button>
          </Surface>
        ) : (
          <form onSubmit={save} className="space-y-5 rounded-xl bg-surface-container-low p-6">
            <TextField label={t('profile.name')} value={name} onChange={(e) => setName(e.target.value)} />
            <div className="flex flex-wrap gap-2">
              {REGIONS.map((r) => (
                <Chip key={r.id} selected={region === r.id} onClick={() => setRegion(r.id)}>
                  {t(r.labelKey)}
                </Chip>
              ))}
            </div>
            <TextField
              label={t('profile.district')}
              value={district}
              error={needDistrict ? t('profile.needDistrict') : null}
              onChange={(e) => {
                setDistrict(e.target.value);
                setNeedDistrict(false);
              }}
            />
            <div className="flex gap-2">
              <Chip selected={lang === 'en'} onClick={() => setLang('en')}>English</Chip>
              <Chip selected={lang === 'hi'} onClick={() => setLang('hi')}>हिन्दी</Chip>
            </div>
            {update.isError && (
              <p role="alert" className="font-body text-sm text-error">
                {messageFor(update.error)}
              </p>
            )}
            <div className="flex gap-3">
              <Button type="submit" busy={update.isPending}>
                {t('common.save')}
              </Button>
              <Button variant="tertiary" onClick={() => setEditing(false)}>
                {t('common.cancel')}
              </Button>
            </div>
          </form>
        )}

        <Button
          variant="quiet"
          block
          onClick={() => {
            signOut();
            navigate('/login', { replace: true });
          }}
        >
          <Icon name="logout" />
          {t('profile.signOut')}
        </Button>
      </main>
    </Screen>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className="font-label text-xs font-bold uppercase tracking-widest text-on-surface-variant">{label}</span>
      <span className="font-body text-base text-on-surface">{value}</span>
    </div>
  );
}
