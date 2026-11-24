import { requireAdmin } from '@/lib/auth';
import PasswordForm from '@/components/studio/PasswordForm';

export const metadata = { title: 'Account' };

export default async function AccountPage() {
  const { username, user } = await requireAdmin();
  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Account</h1>
      <section className="rounded-lg border border-border bg-background p-5 space-y-1 text-sm">
        <p>
          <span className="text-muted-foreground">Username:</span> {username}
        </p>
        <p>
          <span className="text-muted-foreground">Email:</span> {user.email}
        </p>
      </section>
      <section className="rounded-lg border border-border bg-background p-5">
        <h2 className="font-medium mb-4">Change password</h2>
        <PasswordForm />
      </section>
    </div>
  );
}
