import { requireUser } from '@/lib/auth/actions';
import { AccountClient } from './AccountClient';

export default async function AccountPage() {
  const user = await requireUser();

  return (
    <AccountClient
      email={user.email || ''}
      createdAt={user.created_at}
    />
  );
}
