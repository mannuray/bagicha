import { useTranslation } from 'react-i18next';
import { Icon } from '../../ui';
import { useWeather } from './api';

const ICONS: Record<string, string> = {
  CLEAR: 'sunny',
  PARTLY_CLOUDY: 'partly_cloudy_day',
  CLOUDY: 'cloud',
  FOG: 'foggy',
  DRIZZLE: 'rainy_light',
  RAIN: 'rainy',
  HEAVY_RAIN: 'rainy_heavy',
  THUNDERSTORM: 'thunderstorm',
  SNOW: 'weather_snowy',
};

const deg = (c: number) => `${Math.round(c)}°`;

/** Today's weather for the gardener's place. Hidden while loading, on error, or when there is none: never made up. */
export function WeatherCard() {
  const { t } = useTranslation();
  const { data } = useWeather();
  const weather = data?.weather;
  if (!weather || !data.source) return null;
  const { now, today } = weather;
  const { tip } = data;

  return (
    <section
      aria-labelledby="weather-heading"
      className="flex items-center gap-3 rounded-xl bg-surface-container-low p-3"
    >
      <Icon name={ICONS[now.condition]} className="text-[40px] text-primary" />
      <div className="min-w-0 flex-1">
        <h2 id="weather-heading" className="font-label text-xs font-bold uppercase tracking-widest text-on-surface-variant">
          {t('weather.title')}
        </h2>
        <p className="font-headline text-lg text-on-surface">
          {deg(now.temp_c)} · {t(`weather.condition.${now.condition}`)}
        </p>
        <p className="font-body text-sm text-on-surface-variant">
          {t('weather.highLow', { high: deg(today.max_c), low: deg(today.min_c) })} ·{' '}
          {t('weather.rainChance', { chance: Math.round(today.rain_chance) })}
        </p>
        {tip && <p className="mt-1 font-body text-sm text-on-surface">{tip}</p>}
      </div>
      <p className="self-end font-body text-[10px] text-outline">{t('weather.source', { source: data.source })}</p>
    </section>
  );
}
