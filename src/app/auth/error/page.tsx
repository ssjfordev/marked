import Link from 'next/link';

export default function AuthErrorPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6 text-center">
        <h1 className="text-2xl font-bold">Authentication Error</h1>
        <p className="text-gray-600">
          Something went wrong during authentication. Please try again.
        </p>
        <Link
          href="/login"
          className="inline-block rounded-lg bg-black px-6 py-3 text-white hover:bg-gray-800"
        >
          Back to Login
        </Link>
      </div>
    </div>
  );
}
