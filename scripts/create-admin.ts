/**
 * Create (or reset) the Studio administrator account.
 *
 *   npm run studio:create-admin -- --username sanket --email you@example.com
 *   npm run studio:create-admin -- --username sanket --email you@example.com --confirm   # production
 *
 * The password is typed at a hidden prompt (or read from STUDIO_ADMIN_PASSWORD
 * for automation). It is never accepted as a command-line argument, because
 * arguments end up in shell history.
 * Re-running for an existing email resets that user's password and re-asserts admin.
 */
import { createInterface } from 'node:readline';
import { Writable } from 'node:stream';
import { scriptClient, requireConfirmForRemote, arg } from './_shared';

const USERNAME_RE = /^[a-z0-9_]{3,32}$/;

function passwordProblems(pw: string): string[] {
  const problems: string[] = [];
  if (pw.length < 12) problems.push('at least 12 characters');
  if (!/[a-z]/.test(pw)) problems.push('a lowercase letter');
  if (!/[A-Z]/.test(pw)) problems.push('an uppercase letter');
  if (!/[0-9]/.test(pw)) problems.push('a digit');
  return problems;
}

function promptHidden(question: string): Promise<string> {
  let muted = false;
  const output = new Writable({
    write(chunk, _enc, cb) {
      if (!muted) process.stdout.write(chunk);
      cb();
    },
  });
  const rl = createInterface({ input: process.stdin, output, terminal: true });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      process.stdout.write('\n');
      resolve(answer);
    });
    muted = true;
  });
}

async function main() {
  const username = arg('username')?.toLowerCase();
  const email = arg('email')?.toLowerCase();
  if (!username || !USERNAME_RE.test(username) || !email || !email.includes('@')) {
    console.error('Usage: npm run studio:create-admin -- --username <a-z0-9_, 3-32 chars> --email <email> [--confirm]');
    process.exit(1);
  }

  const { url, supabase } = scriptClient();
  requireConfirmForRemote(url);

  let password = process.env.STUDIO_ADMIN_PASSWORD;
  if (!password) {
    password = await promptHidden('New Studio password: ');
    const again = await promptHidden('Repeat password:     ');
    if (password !== again) {
      console.error('✗ Passwords do not match.');
      process.exit(1);
    }
  }
  const problems = passwordProblems(password);
  if (problems.length) {
    console.error(`✗ Password needs ${problems.join(', ')}.`);
    process.exit(1);
  }

  // Find an existing user with this email (small user base: one page is plenty).
  const { data: list, error: listError } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (listError) throw listError;
  const existing = list.users.find((u) => u.email?.toLowerCase() === email);

  let userId: string;
  if (existing) {
    const { error } = await supabase.auth.admin.updateUserById(existing.id, {
      password,
      email_confirm: true,
      user_metadata: { username },
    });
    if (error) throw error;
    userId = existing.id;
    console.log('✓ Existing user found: password reset');
  } else {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { username },
    });
    if (error) throw error;
    userId = data.user.id;
    console.log('✓ User created');
  }

  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({ id: userId, username, role: 'admin' }, { onConflict: 'id' });
  if (profileError) throw profileError;

  console.log(`✓ "${username}" is a Studio admin. Log in at /studio/login with this username and password.`);
}

main().catch((err) => {
  console.error('✗ Failed:', err.message ?? err);
  process.exit(1);
});
