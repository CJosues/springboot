import NextAuth from 'next-auth';
import { authConfig } from './auth.config';
import Credentials from 'next-auth/providers/credentials';
import { z } from 'zod';
import postgres from 'postgres';
import bcrypt from 'bcrypt';
import type { User } from '@/app/lib/definitions';

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

async function getUser(email: string): Promise<User | undefined> {
  try {
    const rows = await sql<User[]>`SELECT * FROM users WHERE email=${email}`;
    return rows[0];
  } catch (error) {
    console.error('[AUTH] Failed to fetch user:', error);
    throw new Error('Failed to fetch user.');
  }
}

export const { auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        console.log('[AUTH] Authorize called with credentials:', credentials);
        
        const parsed = z
          .object({ email: z.string().email(), password: z.string().min(1) })
          .safeParse(credentials);

        if (!parsed.success) {
          console.log('[AUTH] Validation failed:', parsed.error);
          return null;
        }

        const { email, password } = parsed.data;
        console.log('[AUTH] Looking for user with email:', email);

        let userRow: User | undefined;
        try {
          userRow = await getUser(email);
        } catch (err) {
          console.error('[AUTH] getUser error:', err);
          return null;
        }

        if (!userRow) {
          console.log('[AUTH] User not found');
          return null;
        }

        console.log('[AUTH] User found:', { id: userRow.id, email: userRow.email });

        let ok = false;
        try {
          if (typeof userRow.password === 'string' && userRow.password.startsWith('$2')) {
            console.log('[AUTH] Comparing bcrypt password');
            ok = await bcrypt.compare(password, userRow.password);
          } else {
            console.log('[AUTH] Comparing plaintext password');
            ok = password === userRow.password;
          }
        } catch (err) {
          console.log('[AUTH] Password comparison error, falling back to plaintext:', err);
          ok = password === userRow.password;
        }

        console.log('[AUTH] Password match result:', ok);

        if (!ok) {
          console.log('[AUTH] Password mismatch');
          return null;
        }

        const user = { id: userRow.id, name: userRow.name ?? 'User', email: userRow.email };
        console.log('[AUTH] Authorization success:', user);
        return user;
      },
    }),
  ],
});
