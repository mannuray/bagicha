/**
 * Passport strategy name for the few routes an account waiting to be deleted
 * may still use (keep the account, sign out). Every other route uses 'jwt',
 * which refuses such an account.
 */
export const JWT_ALLOW_PENDING = 'jwt-pending';
