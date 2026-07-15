'use client';

import React, { useState } from 'react';
import { useForm } from '@tanstack/react-form';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { Button } from '@atlas/ui/components/button';
import { Input } from '@atlas/ui/components/input';
import { Label } from '@atlas/ui/components/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@atlas/ui/components/card';
import { useAuthControllerLogin } from '@atlas/api-client';
import { useAuthStore } from '../../store/useAuthStore';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const dynamic = 'force-dynamic';

export default function LoginPage() {
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loginMutation = useAuthControllerLogin();

  const form = useForm({
    defaultValues: {
      email: '',
      password: '',
    },
    onSubmit: async ({ value }) => {
      setErrorMsg(null);
      try {
        const response = await loginMutation.mutateAsync({
          data: value,
        });

        const res = response as any;
        if (res?.success && res?.data?.user) {
          setUser(res.data.user);
          router.push('/');
        } else {
          setErrorMsg('Authentication failed. Check your credentials.');
        }
      } catch (err: any) {
        const backendMessage = err?.response?.data?.message || err?.message || 'Login failed';
        setErrorMsg(backendMessage);
      }
    },
  });

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-brand-canvas p-6 select-none">
      <div className="w-full max-w-sm">
        {/* Editorial Brand Header */}
        <div className="mb-8 text-center md:text-left">
          <h1 className="font-serif text-4xl italic tracking-tight leading-none mb-2 text-[#111111]">
            Cabinet
          </h1>
          <p className="text-xs text-[#787774] font-mono tracking-tight uppercase">
            Gustam Platform · Sec.01
          </p>
        </div>

        <Card className="border-brand-border bg-white rounded-lg shadow-none">
          <CardHeader className="pb-4 pt-6 px-6">
            <CardTitle className="text-sm font-semibold tracking-tight text-[#111111]">
              Sign in to Cabinet
            </CardTitle>
            <CardDescription className="text-xs text-[#787774]">
              Enter your seeded admin credentials to gain workspace access.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                e.stopPropagation();
                form.handleSubmit();
              }}
              className="space-y-4"
            >
              {errorMsg && (
                <div className="rounded-[4px] bg-[#FDEBEC] px-3 py-2 text-xs font-semibold text-[#9F2F2D] border border-[#FDEBEC]/20">
                  {errorMsg}
                </div>
              )}

              <form.Field
                name="email"
                validators={{
                  onChange: ({ value }) => {
                    const result = loginSchema.shape.email.safeParse(value);
                    return result.success ? undefined : result.error.issues[0]?.message;
                  },
                }}
                children={(field) => {
                  const hasError = field.state.meta.errors.length > 0;
                  return (
                    <div className="space-y-1.5">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        name={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        type="email"
                        autoComplete="email"
                        placeholder="admin@gustam.dev"
                        className={hasError ? "border-[#9F2F2D] focus-visible:border-[#9F2F2D]" : ""}
                      />
                      {hasError && (
                        <p className="text-[10px] font-semibold text-[#9F2F2D] uppercase tracking-wide">
                          {field.state.meta.errors.join(', ')}
                        </p>
                      )}
                    </div>
                  );
                }}
              />

              <form.Field
                name="password"
                validators={{
                  onChange: ({ value }) => {
                    const result = loginSchema.shape.password.safeParse(value);
                    return result.success ? undefined : result.error.issues[0]?.message;
                  },
                }}
                children={(field) => {
                  const hasError = field.state.meta.errors.length > 0;
                  return (
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <Label htmlFor="password">Password</Label>
                      </div>
                      <Input
                        id="password"
                        name={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        type="password"
                        autoComplete="current-password"
                        placeholder="••••••••"
                        className={hasError ? "border-[#9F2F2D] focus-visible:border-[#9F2F2D]" : ""}
                      />
                      {hasError && (
                        <p className="text-[10px] font-semibold text-[#9F2F2D] uppercase tracking-wide">
                          {field.state.meta.errors.join(', ')}
                        </p>
                      )}
                    </div>
                  );
                }}
              />

              <form.Subscribe selector={(state) => [state.isSubmitting]}>
                {([isSubmitting]) => (
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full mt-2 font-semibold tracking-tight text-xs h-9 uppercase"
                  >
                    {isSubmitting ? 'Authenticating...' : 'Sign in'}
                  </Button>
                )}
              </form.Subscribe>
            </form>
          </CardContent>
        </Card>

        {/* Footer info */}
        <div className="mt-8 text-center md:text-left border-t border-[#EAEAEA] pt-4">
          <p className="text-[10px] font-mono text-[#787774] uppercase tracking-wider">
            Protected by HttpOnly Session Cookies · SameSite Lax
          </p>
        </div>
      </div>
    </div>
  );
}
