import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { BagichaLogo, Icon } from '../../ui';

/** The one-page introduction a signed-out visitor sees on the website (Stitch "Budtale — Marketing Landing Page"). */
export function LandingPage() {
  const { t } = useTranslation();
  return (
    <div className="min-h-dvh bg-surface text-on-surface">
      <Header />
      <main>
        <Hero />
        <Features />
        <Steps />
        <section className="mx-auto max-w-6xl px-4 py-8 md:px-12">
          <div className="space-y-2 rounded-[36px] bg-primary-fixed/50 p-8 md:p-12">
            <p className="flex items-center gap-2 font-label text-xs font-bold uppercase tracking-wider text-secondary">
              <Icon name="translate" className="text-sm" />
              {t('landing.indiaEyebrow')}
            </p>
            <h2 className="text-balance font-headline text-2xl font-bold text-primary md:text-3xl">{t('landing.indiaTitle')}</h2>
            <p className="max-w-2xl font-body text-sm leading-relaxed text-primary/80 md:text-base">{t('landing.indiaBody')}</p>
          </div>
        </section>
        <section className="mx-auto max-w-2xl space-y-6 px-4 py-16 text-center md:py-24">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-secondary-fixed text-secondary">
            <Icon name="yard" className="text-3xl" />
          </span>
          <h2 className="text-balance font-headline text-3xl font-bold tracking-tight text-primary md:text-5xl">{t('landing.ctaTitle')}</h2>
          <p className="mx-auto max-w-lg font-body text-base text-on-surface/75 md:text-lg">{t('landing.ctaBody')}</p>
          <div className="flex justify-center pt-2">
            <OpenAppLink large />
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

function OpenAppLink({ large = false }: { large?: boolean }) {
  const { t } = useTranslation();
  return (
    <Link
      to="/login"
      className={`bg-primary-gradient inline-flex items-center justify-center gap-2 rounded-full font-label font-bold text-on-primary shadow-[0_8px_40px_rgba(23,49,36,0.2)] transition-transform active:scale-95 ${
        large ? 'min-h-12 px-7 text-base' : 'min-h-10 px-5 text-sm'
      }`}
    >
      {t('landing.open')}
      <Icon name="arrow_forward" className="text-lg" />
    </Link>
  );
}

function Header() {
  const { t } = useTranslation();
  return (
    <header className="sticky top-0 z-40 bg-surface/90 pt-[env(safe-area-inset-top)] backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 md:px-12">
        <Link to="/" className="flex items-center gap-2.5">
          <BagichaLogo size={36} />
          <span className="font-headline text-2xl font-bold tracking-tight text-primary">{t('app.name')}</span>
        </Link>
        <nav className="flex items-center gap-4 md:gap-6">
          <Link to="/login" className="font-label text-sm font-bold text-primary/75 hover:text-primary">
            {t('landing.signIn')}
          </Link>
          <span className="hidden sm:inline-flex">
            <OpenAppLink />
          </span>
        </nav>
      </div>
    </header>
  );
}

function Hero() {
  const { t } = useTranslation();
  return (
    <section className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-4 pb-16 pt-10 md:px-12 md:pb-24 md:pt-16 lg:grid-cols-12 lg:gap-8">
      <div className="space-y-7 lg:col-span-7">
        <p className="inline-flex items-center gap-2 rounded-full bg-primary-fixed/60 px-3.5 py-1.5 font-label text-xs font-bold tracking-wide text-primary-container">
          <span className="h-1.5 w-1.5 rounded-full bg-secondary" />
          {t('landing.tag')}
        </p>
        <h1 className="text-balance font-headline text-4xl font-bold leading-[1.12] tracking-tight text-primary sm:text-5xl lg:text-[3.5rem]">
          {t('landing.heroTitle')}{' '}
          <span className="block font-normal italic text-secondary">{t('landing.heroAccent')}</span>
        </h1>
        <p className="max-w-xl font-body text-lg leading-relaxed text-on-surface/80 md:text-xl">{t('landing.heroBody')}</p>
        <div className="flex flex-col items-stretch gap-3.5 pt-2 sm:flex-row sm:items-center">
          <OpenAppLink large />
          <p className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-surface-container px-6 font-label text-sm font-bold text-primary/80">
            <Icon name="android" className="text-lg text-primary-container" />
            {t('landing.android')} <span className="font-normal text-secondary">{t('landing.soon')}</span>
          </p>
        </div>
        <ul className="flex flex-wrap gap-x-6 gap-y-2 pt-1 font-body text-xs text-on-surface/60">
          <li className="flex items-center gap-1.5">
            <Icon name="nest_eco_leaf" className="text-base text-primary-container" />
            {t('landing.noteKinds')}
          </li>
          <li className="flex items-center gap-1.5">
            <Icon name="wb_sunny" className="text-base text-primary-container" />
            {t('landing.noteWeather')}
          </li>
        </ul>
      </div>
      <div className="flex justify-center lg:col-span-5 lg:justify-end">
        <PhoneMock />
      </div>
    </section>
  );
}

/** An illustration of the home screen; decorative, so screen readers skip it. */
function PhoneMock() {
  const { t } = useTranslation();
  const tasks = [
    { title: t('landing.mock.t1'), meta: t('landing.mock.t1Meta'), done: true },
    { title: t('landing.mock.t2'), meta: t('landing.mock.t2Meta'), done: false },
    { title: t('landing.mock.t3'), meta: t('landing.mock.t3Meta'), done: false },
  ];
  return (
    <div aria-hidden className="relative w-full max-w-[340px]">
      <div className="absolute -inset-4 rounded-[48px] bg-primary-container/5 blur-xl" />
      <div className="relative rounded-[42px] bg-primary p-3 shadow-2xl shadow-primary/15">
        <div className="overflow-hidden rounded-[34px] bg-surface text-left">
          <div className="flex items-center justify-between bg-surface-container-low px-5 pb-3 pt-5">
            <div>
              <p className="font-label text-[10px] font-bold uppercase tracking-wider text-secondary">{t('landing.mock.place')}</p>
              <p className="font-headline text-lg font-bold text-primary">{t('landing.mock.title')}</p>
            </div>
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-fixed/60 text-primary">
              <Icon name="notifications" className="text-base" />
            </span>
          </div>
          <div className="mx-4 mt-3 flex items-start gap-2.5 rounded-2xl bg-secondary-fixed/60 p-3">
            <Icon name="warning" className="mt-0.5 text-lg text-secondary" />
            <div>
              <p className="font-label text-xs font-bold text-secondary">{t('landing.mock.alert')}</p>
              <p className="font-body text-[11px] leading-snug text-secondary/85">{t('landing.mock.alertBody')}</p>
            </div>
          </div>
          <div className="space-y-2.5 p-4">
            <div className="flex items-center justify-between pb-1">
              <span className="font-label text-[11px] font-bold uppercase tracking-wider text-primary">{t('landing.mock.today')}</span>
              <span className="font-label text-[11px] font-bold text-primary-container">{t('landing.mock.pending')}</span>
            </div>
            {tasks.map((task) => (
              <div key={task.title} className="flex items-center justify-between rounded-2xl bg-surface-container-low p-3">
                <div className="flex items-center gap-2.5">
                  {task.done ? (
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-container text-on-primary">
                      <Icon name="check" className="text-sm" />
                    </span>
                  ) : (
                    <span className="h-6 w-6 rounded-full border-2 border-secondary/60 bg-surface-container-lowest" />
                  )}
                  <div>
                    <p className={`font-label text-xs font-bold text-primary ${task.done ? 'line-through opacity-70' : ''}`}>{task.title}</p>
                    <p className="font-body text-[10px] text-primary/60">{task.meta}</p>
                  </div>
                </div>
                {task.done && (
                  <span className="rounded-full bg-primary-container/10 px-2 py-0.5 font-label text-[10px] text-primary-container">
                    {t('landing.mock.done')}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const FEATURES = [
  { n: 1, icon: 'book_2', warm: false },
  { n: 2, icon: 'schedule', warm: true },
  { n: 3, icon: 'partly_cloudy_day', warm: false },
  { n: 4, icon: 'photo_camera', warm: true },
] as const;

function Features() {
  const { t } = useTranslation();
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 md:px-12">
      <div className="mx-auto mb-12 max-w-2xl text-center">
        <p className="font-label text-xs font-bold uppercase tracking-widest text-secondary">{t('landing.featuresEyebrow')}</p>
        <h2 className="mt-2 text-balance font-headline text-3xl font-bold text-primary md:text-4xl">{t('landing.featuresTitle')}</h2>
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map((f) => (
          <article key={f.n} className="rounded-[28px] bg-surface-container-low p-7">
            <span
              className={`mb-6 flex h-12 w-12 items-center justify-center rounded-2xl ${
                f.warm ? 'bg-secondary-fixed/60 text-secondary' : 'bg-primary-fixed/60 text-primary-container'
              }`}
            >
              <Icon name={f.icon} className="text-2xl" />
            </span>
            <h3 className="mb-3 font-headline text-xl font-bold leading-snug text-primary">{t(`landing.f${f.n}Title`)}</h3>
            <p className="font-body text-sm leading-relaxed text-on-surface/75">{t(`landing.f${f.n}Body`)}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function Steps() {
  const { t } = useTranslation();
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 md:px-12">
      <div className="rounded-[36px] bg-surface-container-low p-8 md:p-14">
        <p className="font-label text-xs font-bold uppercase tracking-widest text-secondary">{t('landing.stepsEyebrow')}</p>
        <h2 className="mb-10 mt-1 font-headline text-3xl font-bold text-primary">{t('landing.stepsTitle')}</h2>
        <ol className="grid grid-cols-1 gap-8 md:grid-cols-3 md:gap-10">
          {[1, 2, 3].map((n) => (
            <li key={n} className="space-y-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary font-headline text-base font-bold text-on-primary">
                {n}
              </span>
              <h3 className="font-headline text-xl font-bold text-primary">{t(`landing.s${n}Title`)}</h3>
              <p className="font-body text-sm leading-relaxed text-on-surface/75">{t(`landing.s${n}Body`)}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function Footer() {
  const { t } = useTranslation();
  const links = [
    { to: '/privacy', label: t('landing.privacy') },
    { to: '/terms', label: t('landing.terms') },
    { to: '/delete-account', label: t('landing.deleteAccount') },
  ];
  return (
    <footer className="mt-12 bg-surface-container-low pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto max-w-6xl px-4 py-12 md:px-12 md:py-16">
        <div className="flex flex-col items-start justify-between gap-8 pb-8 md:flex-row md:items-center">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <BagichaLogo size={28} />
              <span className="font-headline text-xl font-bold text-primary">{t('app.name')}</span>
            </div>
            <p className="font-body text-xs text-on-surface/60">{t('landing.footerLine')}</p>
          </div>
          <nav className="flex flex-wrap items-center gap-6 font-label text-xs font-bold text-primary/75">
            {links.map((l) => (
              <Link key={l.to} to={l.to} className="hover:text-primary">
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
        <p className="pt-6 font-body text-xs text-on-surface/50">{t('landing.copyright')}</p>
      </div>
    </footer>
  );
}
