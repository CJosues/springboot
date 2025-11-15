import Link from 'next/link';
import LoginForm from '@/app/ui/login-form';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Log in',
};

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-lg">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-xl font-semibold">Log in</h1>
          <Link href="/" className="text-sm text-blue-500 hover:underline">
            Back
          </Link>
        </div>

        <LoginForm />
      </div>
    </main>
  );
}
