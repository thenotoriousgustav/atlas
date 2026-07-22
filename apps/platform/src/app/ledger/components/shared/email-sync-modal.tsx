import React, { useEffect, useState } from 'react';
import {
  useEmailSyncControllerGetConfig,
  useEmailSyncControllerSaveConfig,
  useEmailSyncControllerSyncEmails,
  useEmailSyncControllerTestConnection,
} from '@atlas/api-client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@atlas/ui/components/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@atlas/ui/components/alert-dialog';
import { Button } from '@atlas/ui/components/button';
import { Input } from '@atlas/ui/components/input';
import { Label } from '@atlas/ui/components/label';
import { Checkbox } from '@atlas/ui/components/checkbox';
import {
  EnvelopeSimple,
  ArrowsClockwise,
  CheckCircle,
  Gear,
  PlugsConnected,
  WarningCircle,
} from '@phosphor-icons/react';
import { toast } from 'sonner';

interface EmailSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessSync?: () => void;
}

export function EmailSyncModal({ isOpen, onClose, onSuccessSync }: EmailSyncModalProps) {
  const [activeTab, setActiveTab] = useState<'sync' | 'settings'>('sync');

  // Form states matching UpdateEmailSyncConfigDto
  const [imapHost, setImapHost] = useState('imap.gmail.com');
  const [imapPort, setImapPort] = useState('993');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isActive, setIsActive] = useState(true);

  // AlertDialog State
  const [alertDialogState, setAlertDialogState] = useState<{
    open: boolean;
    type: 'success' | 'error';
    title: string;
    description: string;
  }>({
    open: false,
    type: 'success',
    title: '',
    description: '',
  });

  // Queries & Mutations
  const { data: configData, refetch: refetchConfig } = useEmailSyncControllerGetConfig({
    query: { enabled: isOpen },
  });

  const saveConfigMutation = useEmailSyncControllerSaveConfig();
  const testConnectionMutation = useEmailSyncControllerTestConnection();
  const syncEmailsMutation = useEmailSyncControllerSyncEmails();

  useEffect(() => {
    if (configData && (configData as any).data) {
      const cfg = (configData as any).data;
      setImapHost(cfg.imapHost || cfg.host || 'imap.gmail.com');
      setImapPort(String(cfg.imapPort || cfg.port || 993));
      setUsername(cfg.username || cfg.email || '');
      setPassword(cfg.password || '');
      setIsActive(cfg.isActive ?? cfg.enabled ?? true);
    }
  }, [configData]);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await saveConfigMutation.mutateAsync({
        data: {
          imapHost: imapHost.trim(),
          imapPort: parseInt(imapPort, 10) || 993,
          username: username.trim(),
          password,
          isActive,
        },
      });
      refetchConfig();
      setAlertDialogState({
        open: true,
        type: 'success',
        title: 'Settings Saved Successfully',
        description:
          'Your IMAP email credentials and sync preferences have been saved successfully.',
      });
    } catch {
      setAlertDialogState({
        open: true,
        type: 'error',
        title: 'Failed to Save Settings',
        description: 'An error occurred while saving your IMAP email sync configuration.',
      });
    }
  };

  const handleTestConnection = async () => {
    try {
      const res = await testConnectionMutation.mutateAsync();
      if ((res as any)?.success) {
        setAlertDialogState({
          open: true,
          type: 'success',
          title: 'IMAP Connection Test Successful!',
          description:
            'Successfully connected and authenticated with your email IMAP server. You can now fetch bank e-statement transactions.',
        });
      } else {
        setAlertDialogState({
          open: true,
          type: 'error',
          title: 'IMAP Connection Test Failed',
          description:
            (res as any)?.message ||
            'Could not authenticate with IMAP server. Please verify your Email and App Password.',
        });
      }
    } catch (err: any) {
      setAlertDialogState({
        open: true,
        type: 'error',
        title: 'Connection Error',
        description: err?.message || 'Failed to connect to the email server.',
      });
    }
  };

  const handleSyncNow = async () => {
    try {
      const res = await syncEmailsMutation.mutateAsync({ data: {} });
      const addedCount = (res as any)?.data?.syncedCount ?? (res as any)?.syncedCount ?? 0;
      toast.success(
        `Email sync completed! ${
          addedCount > 0 ? `${addedCount} new transactions added.` : 'No new bank e-statements found.'
        }`
      );
      if (onSuccessSync) onSuccessSync();
      onClose();
    } catch {
      toast.error('Failed to sync transactions from email.');
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(val) => !val && onClose()}>
        <DialogContent className="rounded-none border border-[#EAEAEA] bg-white p-6 shadow-lg sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg font-bold text-[#111111] flex items-center gap-2">
              <EnvelopeSimple className="size-5 text-[#111111]" />
              Email E-Statement Sync
            </DialogTitle>
            <p className="text-xs text-[#787774]">
              Automatically parse bank e-statement notification emails (BCA, Mandiri, GoPay, OVO, Bank Jago, etc.).
            </p>
          </DialogHeader>

          {/* Tab Headers */}
          <div className="flex border-b border-[#EAEAEA] mt-2">
            <button
              onClick={() => setActiveTab('sync')}
              className={`px-3 py-2 text-xs font-medium border-b-2 flex items-center gap-1.5 transition-colors ${
                activeTab === 'sync'
                  ? 'border-[#111111] text-[#111111]'
                  : 'border-transparent text-[#787774] hover:text-[#111111]'
              }`}
            >
              <ArrowsClockwise className="size-3.5" />
              Sync Now
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-3 py-2 text-xs font-medium border-b-2 flex items-center gap-1.5 transition-colors ${
                activeTab === 'settings'
                  ? 'border-[#111111] text-[#111111]'
                  : 'border-transparent text-[#787774] hover:text-[#111111]'
              }`}
            >
              <Gear className="size-3.5" />
              IMAP Configuration
            </button>
          </div>

          {/* Tab Content: Sync Now */}
          {activeTab === 'sync' && (
            <div className="space-y-4 pt-4">
              <div className="rounded-none border border-[#EAEAEA] bg-[#F7F6F3] p-4 space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#111111]">
                  <CheckCircle className="size-4 text-[#346538]" />
                  <span>Automated Email Transaction Fetcher</span>
                </div>
                <p className="text-[11px] text-[#787774] leading-relaxed">
                  Reads incoming credit/debit transaction notifications from your linked email inbox and converts them directly into ledger transactions.
                </p>
              </div>

              <Button
                onClick={handleSyncNow}
                disabled={syncEmailsMutation.isPending}
                className="w-full h-10 rounded-none bg-[#111111] text-xs font-medium text-white hover:bg-[#333333] flex items-center justify-center gap-2"
              >
                <ArrowsClockwise className={`size-4 ${syncEmailsMutation.isPending ? 'animate-spin' : ''}`} />
                <span>{syncEmailsMutation.isPending ? 'Scanning Email Inbox...' : 'Fetch & Sync Email Transactions'}</span>
              </Button>
            </div>
          )}

          {/* Tab Content: IMAP Settings */}
          {activeTab === 'settings' && (
            <form onSubmit={handleSaveConfig} className="space-y-3 pt-4">
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2 space-y-1">
                  <Label className="text-[11px] font-medium text-[#111111]">IMAP Server</Label>
                  <Input
                    value={imapHost}
                    onChange={(e) => setImapHost(e.target.value)}
                    placeholder="imap.gmail.com"
                    className="h-8 rounded-none border-[#EAEAEA] text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] font-medium text-[#111111]">Port</Label>
                  <Input
                    value={imapPort}
                    onChange={(e) => setImapPort(e.target.value)}
                    placeholder="993"
                    className="h-8 rounded-none border-[#EAEAEA] text-xs font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] font-medium text-[#111111]">Email / Username</Label>
                <Input
                  type="email"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="your.email@gmail.com"
                  className="h-8 rounded-none border-[#EAEAEA] text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] font-medium text-[#111111]">App Password / Password</Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••••••"
                  className="h-8 rounded-none border-[#EAEAEA] text-xs font-mono"
                />
                <p className="text-[10px] text-[#787774] leading-tight">
                  For Gmail, generate a 16-character App Password at{' '}
                  <a
                    href="https://myaccount.google.com/apppasswords"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline text-[#111111] font-semibold"
                  >
                    myaccount.google.com/apppasswords
                  </a>.
                </p>
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <Checkbox
                  id="isActive"
                  checked={isActive}
                  onCheckedChange={(checked) => setIsActive(!!checked)}
                  className="rounded-none border-[#CCCCCC] data-[state=checked]:bg-[#111111]"
                />
                <Label htmlFor="isActive" className="text-xs text-[#111111] font-normal cursor-pointer">
                  Enable Email Sync Service
                </Label>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleTestConnection}
                  disabled={testConnectionMutation.isPending}
                  className="h-8 rounded-none border-[#EAEAEA] text-[11px] text-[#111111] hover:bg-[#F7F6F3] gap-1.5"
                >
                  <PlugsConnected className="size-3.5" />
                  <span>{testConnectionMutation.isPending ? 'Testing...' : 'Test IMAP'}</span>
                </Button>

                <Button
                  type="submit"
                  disabled={saveConfigMutation.isPending}
                  className="h-8 rounded-none bg-[#111111] text-[11px] font-medium text-white hover:bg-[#333333]"
                >
                  Save Settings
                </Button>
              </div>
            </form>
          )}

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="h-8 rounded-none border-[#EAEAEA] text-xs text-[#787774] hover:bg-[#F7F6F3]"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Shadcn AlertDialog for Save / Test Feedback */}
      <AlertDialog
        open={alertDialogState.open}
        onOpenChange={(val) => setAlertDialogState((prev) => ({ ...prev, open: val }))}
      >
        <AlertDialogContent className="rounded-none border border-[#EAEAEA] bg-white p-6 shadow-xl sm:max-w-md">
          <AlertDialogHeader className="space-y-2">
            <div className="flex items-center gap-2">
              {alertDialogState.type === 'success' ? (
                <CheckCircle className="size-6 text-[#346538]" />
              ) : (
                <WarningCircle className="size-6 text-[#9F2F2D]" />
              )}
              <AlertDialogTitle className="font-serif text-base font-bold text-[#111111]">
                {alertDialogState.title}
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-xs text-[#787774] leading-relaxed pt-1">
              {alertDialogState.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="pt-4">
            <AlertDialogAction
              onClick={() => setAlertDialogState((prev) => ({ ...prev, open: false }))}
              className="h-9 rounded-none bg-[#111111] text-xs font-medium text-white hover:bg-[#333333]"
            >
              Understand & Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
