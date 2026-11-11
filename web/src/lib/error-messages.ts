import type { TFunction } from 'i18next';
import { AppStateError, isApiError } from './errors';

/**
 * The user-facing sentence for any thrown value, keyed by its backend or client
 * code; unknown codes get the generic message. Takes the screen's translator.
 */
export function messageFor(err: unknown, t: TFunction): string {
  const code = isApiError(err) || err instanceof AppStateError ? err.code : null;
  const generic = t('errors.generic');
  return code ? t(`errors.${code}`, { defaultValue: generic }) : generic;
}
