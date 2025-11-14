'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import postgres from 'postgres';
import bcrypt from 'bcrypt';
import { signIn } from '@/auth';
import { AuthError } from 'next-auth';

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

const FormSchema = z.object({
  customerId: z.string(),
  amount: z.coerce.number(),
  status: z.enum(['pending', 'paid']),
});

// ✅ Reutilizamos el mismo esquema para edición
const UpdateInvoice = FormSchema;

export type State = {
  message: string | null;
  // Allow arbitrary form field errors across different forms
  errors?: Record<string, string[]>;
};

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// ✅ Para formularios con useActionState
export async function createInvoice(
  _prevState: State,
  formData: FormData
): Promise<State> {
  const validatedFields = FormSchema.safeParse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });

  if (!validatedFields.success) {
    return {
      message: 'Missing Fields. Failed to Create Invoice.',
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { customerId, amount, status } = validatedFields.data;
  const amountInCents = amount * 100;
  const date = new Date().toISOString().split('T')[0];

  try {
    await sql`
      INSERT INTO invoices (customer_id, amount, status, date)
      VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
    `;
  } catch (error) {
    return { message: 'Database Error: Failed to Create Invoice.' };
  }

  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');

  return { message: null };
}

// ✅ Para formularios sin useActionState
export async function updateInvoice(id: string, formData: FormData): Promise<void> {
  const validatedFields = FormSchema.safeParse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });

  if (!validatedFields.success) {
    throw new Error('Missing Fields. Failed to Update Invoice.');
  }

  const { customerId, amount, status } = validatedFields.data;
  const amountInCents = amount * 100;

  try {
    await sql`
      UPDATE invoices
      SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
      WHERE id = ${id}
    `;
  } catch (error) {
    throw new Error('Database Error: Failed to Update Invoice.');
  }

  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

// ✅ Para formularios con useActionState
export async function updateInvoiceWithState(
  id: string,
  prevState: State,
  formData: FormData
): Promise<State> {
  const validatedFields = UpdateInvoice.safeParse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });

  if (!validatedFields.success) {
    return {
      message: 'Missing Fields. Failed to Update Invoice.',
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { customerId, amount, status } = validatedFields.data;
  const amountInCents = amount * 100;

  try {
    await sql`
      UPDATE invoices
      SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
      WHERE id = ${id}
    `;
  } catch (error) {
    return { message: 'Database Error: Failed to Update Invoice.' };
  }

  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');

  return { message: null };
}

export async function deleteInvoice(id: string): Promise<void> {
  try {
    await sql`DELETE FROM invoices WHERE id = ${id}`;
  } catch (error) {
    throw new Error('Database Error: Failed to Delete Invoice.');
  }

  revalidatePath('/dashboard/invoices');
}

// ✅ Login action that returns State for useActionState
export async function loginWithState(
  _prevState: State,
  formData: FormData
): Promise<State> {
  const validated = LoginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });

  if (!validated.success) {
    return {
      message: 'Missing or invalid fields. Failed to log in.',
      errors: validated.error.flatten().fieldErrors,
    };
  }

  const { email, password } = validated.data;
  console.log('[LOGIN] Attempting login for email:', email);

  try {
    console.log('[LOGIN] Connecting to database...');
    const rows = await sql<{ id: string; email: string; password: string }[]>`
      SELECT id, email, password FROM users WHERE email = ${email}
    `;

    console.log('[LOGIN] Query result:', rows?.length ?? 0, 'rows found');

    if (!rows || rows.length === 0) {
      console.log('[LOGIN] User not found');
      return { message: 'Invalid credentials.' };
    }

    const user = rows[0];
    console.log('[LOGIN] User found:', { id: user.id, email: user.email });

    let passwordMatches = false;

    try {
      // If password looks like a bcrypt hash, compare with bcrypt
      if (typeof user.password === 'string' && user.password.startsWith('$2')) {
        console.log('[LOGIN] Comparing bcrypt password');
        passwordMatches = await bcrypt.compare(password, user.password);
      } else {
        // Fallback: direct comparison (for demo/placeholder data)
        console.log('[LOGIN] Comparing plaintext password');
        passwordMatches = password === user.password;
      }
    } catch (err) {
      // If bcrypt fails for any reason, fallback to direct compare
      console.log('[LOGIN] Bcrypt error, falling back:', err);
      passwordMatches = password === user.password;
    }

    console.log('[LOGIN] Password match result:', passwordMatches);

    if (!passwordMatches) {
      console.log('[LOGIN] Password mismatch');
      return { message: 'Invalid credentials.' };
    }

    console.log('[LOGIN] Auth successful, redirecting to /dashboard');
    // On success, redirect to dashboard. In a real app you'd set a session cookie here.
    redirect('/dashboard');

    return { message: null };
  } catch (error) {
    console.error('[LOGIN] Catch block error:', error);
    console.error('[LOGIN] Error message:', error instanceof Error ? error.message : String(error));
    return { message: 'Database Error: Failed to log in.' };
  }
}

// Authenticate via NextAuth signIn helper from `auth.ts`. This action can be
// wired to a client form using `useActionState` or called directly from a
// server component. It returns a user-friendly error message string on
// authentication failure, or `undefined` on success (NextAuth handles the
// redirect/session side-effects).
export async function authenticate(
  _prevState: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  try {
    // signIn is initialized in `auth.ts` and accepts the provider id and the
    // FormData. NextAuth may throw an AuthError for known auth failures.
    await signIn('credentials', formData);
    return undefined;
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return 'Invalid credentials.';
        default:
          return 'Something went wrong.';
      }
    }

    // Unknown error: rethrow so the host can log/handle it.
    throw error;
  }
}
