import { useMutation } from '@tanstack/react-query';
import { useApi } from '../../lib/api';
import { useSession, userSchema } from '../auth';

/** Asks to delete the account. The server signs every device out; this one forgets the session too. */
export function useRequestDeletion() {
  const api = useApi();
  const { signOut } = useSession();
  return useMutation({
    mutationFn: () => api.send('POST', '/user/deletion', {}, userSchema),
    onSuccess: () => signOut(),
  });
}

/** Keeps the account during the notice period; the signed-in user no longer carries a date. */
export function useKeepAccount() {
  const api = useApi();
  const { user, updateUser } = useSession();
  return useMutation({
    mutationFn: async () => {
      await api.remove('/user/deletion');
      if (!user) throw new Error('No signed-in user to keep');
      const kept = { ...user, deletion_due_at: null };
      updateUser(kept);
      return kept;
    },
  });
}
