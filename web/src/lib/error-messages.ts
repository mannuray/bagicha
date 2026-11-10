import i18n from './i18n';
import { AppStateError, isApiError } from './errors';

/** The user-facing sentence for any thrown value, keyed by its backend or client code. */
export function messageFor(err: unknown): string {
  const code = isApiError(err) || err instanceof AppStateError ? err.code : null;
  if (code && i18n.exists(`errors.${code}`)) return i18n.t(`errors.${code}`);
  return i18n.t('errors.generic');
}
