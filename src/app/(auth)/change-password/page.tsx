'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { useLanguage } from '@/lib/language-context';
import { AuthLayout, AuthHeader } from '@/components/auth';
import { FormField } from '@/components/forms';

export default function ChangePasswordPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess(false);
    setFieldErrors({});

    const formData = new FormData(event.currentTarget);
    const data = {
      email: formData.get('email') as string,
      password: formData.get('password') as string,
      confirmPassword: formData.get('confirmPassword') as string,
    };

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        if (result.details?.fieldErrors) {
          setFieldErrors(result.details.fieldErrors);
        } else {
          setError(result.error || t('auth.error.somethingWrong'));
        }
        return;
      }

      setSuccess(true);
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (error: unknown) {
      console.error('Change password error:', error);
      setError(error instanceof Error ? error.message : t('auth.error.somethingWrong'));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AuthLayout>
      <AuthHeader 
        title={t('auth.changePassword.title')}
        subtitle={t('auth.changePassword.subtitle')}
      />

      <form onSubmit={onSubmit} className="space-y-6">
        {error && <Alert variant="error">{error}</Alert>}
        {success && <Alert variant="success">{t('messages.passwordChanged')}</Alert>}

        <div className="space-y-4">
          <FormField
            id="email"
            name="email"
            type="email"
            label={t('auth.email')}
            placeholder="you@example.com"
            autoComplete="email"
            required
            error={fieldErrors.email?.[0]}
          />

          <FormField
            id="password"
            name="password"
            type="password"
            label={t('auth.password')}
            placeholder="••••••••"
            autoComplete="new-password"
            required
            error={fieldErrors.password?.[0]}
            helperText={t('auth.passwordRequirements')}
          />

          <FormField
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            label={t('auth.confirmPassword')}
            placeholder="••••••••"
            autoComplete="new-password"
            required
            error={fieldErrors.confirmPassword?.[0]}
          />
        </div>

        <Button type="submit" className="w-full" isLoading={isLoading}>
          {t('auth.changePassword.button')}
        </Button>

        <div className="text-center text-sm">
          <Link href="/login" className="text-primary hover:underline font-medium">
            {t('auth.changePassword.backToLogin')}
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
}

