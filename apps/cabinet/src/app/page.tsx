'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  useAuthControllerMe,
  useAuthControllerLogout,
} from '@atlas/api-client';
import { useAuthStore } from '../store/useAuthStore';
import {
  Button,
  Card,
  Badge,
} from '@atlas/ui';
import {
  SignOut,
  BookmarkSimple,
  Clock,
  ArrowSquareOut,
  FolderSimple,
  ShieldCheck,
} from '@phosphor-icons/react';

export const dynamic = 'force-dynamic';

export default function DashboardPage() {
  const router = useRouter();
  const { user, setUser, logout } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  const { data: meData, isLoading: isMeLoading } = useAuthControllerMe({
    query: {
      retry: false,
      enabled: true,
    },
  });

  // Sync mount status
  useEffect(() => {
    setMounted(true);
  }, []);

  // 1. Sync backend session into Zustand store
  useEffect(() => {
    if (!isMeLoading) {
      if ((meData as any)?.success && (meData as any)?.data) {
        setUser((meData as any).data);
      } else {
        setUser(null);
        router.push('/login');
      }
      setIsLoading(false);
    }
  }, [meData, isMeLoading, setUser, router]);

  // 2. Handle logout mutation
  const logoutMutation = useAuthControllerLogout();

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
      logout();
      router.push('/login');
    } catch {
      // Fallback redirect
      logout();
      router.push('/login');
    }
  };

  // 3. Render Skeleton Loader (Utilitarian and Clean, no spin)
  if (!mounted || isLoading || !user) {
    return (
      <div className="min-h-[100dvh] bg-brand-canvas p-8 flex flex-col items-center justify-center font-mono text-xs text-[#787774] space-y-4">
        <div className="w-12 h-1 bg-[#EAEAEA] animate-pulse rounded-full" />
        <div className="uppercase tracking-widest animate-pulse">Initializing session...</div>
      </div>
    );
  }

  // 4. Mock Cabinets bookmarks (Simulating Phase 2 UI)
  const mockBookmarks = [
    {
      id: '1',
      title: 'Next.js App Router Documentation',
      url: 'https://nextjs.org/docs',
      description: 'Reference guide for Next.js App Router layout, routing, and data fetching features.',
      category: 'Development',
      badgeVariant: 'blue' as const,
      timestamp: '2 hours ago',
    },
    {
      id: '2',
      title: 'Prisma Client API Reference',
      url: 'https://www.prisma.io/docs/reference/api-reference/prisma-client-reference',
      description: 'Comprehensive documentation on queries, models, and relation operations in Prisma.',
      category: 'Database',
      badgeVariant: 'green' as const,
      timestamp: 'Yesterday',
    },
    {
      id: '3',
      title: 'Minimalist Workspace Aesthetic Reference',
      url: 'https://minimalist-workspace.com',
      description: 'Curated gallery highlighting editorial layout hierarchies and document-centric web platforms.',
      category: 'Design',
      badgeVariant: 'yellow' as const,
      timestamp: '3 days ago',
    },
  ];

  return (
    <div className="min-h-[100dvh] bg-brand-canvas py-12 px-6 md:px-16">
      <div className="max-w-4xl mx-auto space-y-12">
        {/* Workspace Nav Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between border-b border-brand-border pb-6 gap-4">
          <div className="flex items-center gap-3">
            {/* SVG Monogram Mark */}
            <div className="w-7 h-7 bg-[#111111] flex items-center justify-center rounded-[4px] text-white font-serif italic text-sm font-semibold">
              C
            </div>
            <div>
              <h1 className="font-serif text-2xl font-medium tracking-tight text-[#111111]">
                Cabinet
              </h1>
              <p className="text-[10px] text-[#787774] font-mono tracking-tight uppercase">
                Gustam platform · Active Workspace
              </p>
            </div>
          </div>

          {/* User badge and logout action */}
          <div className="flex items-center gap-4">
            <div className="text-right font-mono">
              <p className="text-xs font-semibold text-[#111111]">{user.name}</p>
              <p className="text-[10px] text-[#787774]">{user.email}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="flex items-center gap-1.5 font-semibold text-xs tracking-tight uppercase"
            >
              <SignOut className="w-3.5 h-3.5" />
              Sign out
            </Button>
          </div>
        </header>

        {/* Dashboard grid */}
        <main className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          {/* Main Bookmarks column (col-span-2) */}
          <div className="md:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-mono text-[#787774] uppercase tracking-wider flex items-center gap-2">
                <BookmarkSimple className="w-4 h-4 text-[#111111]" />
                Recent bookmarks
              </h2>
              <Badge variant="outline" className="font-mono text-[9px]">
                {mockBookmarks.length} Items
              </Badge>
            </div>

            {/* List view of bookmarks */}
            <div className="space-y-4">
              {mockBookmarks.map((bookmark) => (
                <Card
                  key={bookmark.id}
                  className="border-brand-border bg-white rounded-lg p-5 transition-all hover:border-[#111111]/30"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-4">
                      <a
                        href={bookmark.url}
                        target="_blank"
                        rel="noreferrer"
                        className="group flex items-center gap-1 text-sm font-semibold text-[#111111] hover:underline"
                      >
                        {bookmark.title}
                        <ArrowSquareOut className="w-3.5 h-3.5 text-[#787774] opacity-0 group-hover:opacity-100 transition-opacity" />
                      </a>
                      <Badge variant={bookmark.badgeVariant}>{bookmark.category}</Badge>
                    </div>

                    <p className="text-xs text-[#787774] leading-relaxed max-w-[65ch]">
                      {bookmark.description}
                    </p>

                    <div className="flex items-center gap-3 pt-2 text-[10px] text-[#787774] font-mono">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {bookmark.timestamp}
                      </span>
                      <span className="text-[#EAEAEA]">•</span>
                      <span className="truncate max-w-[200px]">{bookmark.url}</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Settings / Information sidebar */}
          <div className="space-y-6">
            <h2 className="text-xs font-mono text-[#787774] uppercase tracking-wider flex items-center gap-2">
              <FolderSimple className="w-4 h-4 text-[#111111]" />
              Workspace Status
            </h2>

            <Card className="border-brand-border bg-white p-5 space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#EDF3EC] flex items-center justify-center text-[#346538]">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#111111]">Secured session</p>
                    <p className="text-[10px] text-[#787774] font-mono uppercase">Status: active</p>
                  </div>
                </div>

                <div className="border-t border-[#EAEAEA] pt-3 space-y-2 text-xs">
                  <div className="flex justify-between font-mono text-[10px]">
                    <span className="text-[#787774] uppercase">Module:</span>
                    <span className="font-semibold text-[#111111]">Cabinet v1.0</span>
                  </div>
                  <div className="flex justify-between font-mono text-[10px]">
                    <span className="text-[#787774] uppercase">Database:</span>
                    <span className="font-semibold text-[#111111]">Connected</span>
                  </div>
                  <div className="flex justify-between font-mono text-[10px]">
                    <span className="text-[#787774] uppercase">API Client:</span>
                    <span className="font-semibold text-[#111111]">TanStack/Orval</span>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="border-brand-border bg-[#FBF3DB] text-[#956400] p-4 text-xs space-y-2">
              <p className="font-semibold uppercase tracking-wider text-[10px] font-mono">
                Phase 1 Complete
              </p>
              <p className="leading-relaxed text-[11px]">
                The platform foundation, authentication modules, database seeds, and shared UI system are successfully configured. You can now build Phase 2 CRUD modules.
              </p>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
