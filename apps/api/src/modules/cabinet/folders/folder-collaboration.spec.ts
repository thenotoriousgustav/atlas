import { createHash } from 'node:crypto';
import { FoldersService } from './folders.service';
import { FoldersController } from './folders.controller';
import { IS_PUBLIC_KEY } from '@/common/decorators/public.decorator';

jest.mock('@/auth/guards/auth.guard', () => ({ AuthGuard: class AuthGuard {} }));

const token = 'a'.repeat(64);

describe('Folder collaboration', () => {
  let prisma: any;
  let service: FoldersService;
  beforeEach(() => {
    prisma = {
      folder: { findFirst: jest.fn(), findMany: jest.fn(), updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
      folderMember: { upsert: jest.fn(), deleteMany: jest.fn() },
      $queryRaw: jest.fn().mockResolvedValue([{ id: 'folder', userId: 'owner' }]),
      $transaction: jest.fn((run) => run(prisma)),
    };
    service = new FoldersService(prisma);
  });

  it('stores only an unguessable invitation hash and requires folder ownership', async () => {
    const invitation = await service.enableInvite('owner', 'folder');
    expect(invitation.token).toMatch(/^[a-f0-9]{64}$/);
    expect(prisma.folder.updateMany).toHaveBeenCalledWith({
      where: { id: 'folder', userId: 'owner', deletedAt: null },
      data: { inviteTokenHash: createHash('sha256').update(invitation.token).digest('hex') },
    });
    prisma.folder.updateMany.mockResolvedValue({ count: 0 });
    await expect(service.enableInvite('member', 'folder')).rejects.toThrow('Folder not found');
    await expect(service.disableInvite('member', 'folder')).rejects.toThrow('Folder not found');
  });

  it('accepts the invitation idempotently without creating a membership for the owner', async () => {
    await expect(service.acceptInvite('member', token)).resolves.toEqual({ folderId: 'folder' });
    expect(prisma.folderMember.upsert).toHaveBeenCalledWith({
      where: { folderId_userId: { folderId: 'folder', userId: 'member' } },
      create: { folderId: 'folder', userId: 'member' }, update: {},
    });
    const [query, hash] = prisma.$queryRaw.mock.calls[0];
    expect(query.join('')).toContain('FOR UPDATE');
    expect(hash).toBe(createHash('sha256').update(token).digest('hex'));
    prisma.folderMember.upsert.mockClear();
    await service.acceptInvite('owner', token);
    expect(prisma.folderMember.upsert).not.toHaveBeenCalled();
  });

  it('rejects malformed, revoked, or deleted invitations before adding members', async () => {
    await expect(service.acceptInvite('member', 'invalid')).rejects.toThrow('Invitation not found');
    expect(prisma.$queryRaw).not.toHaveBeenCalled();
    prisma.$queryRaw.mockResolvedValue([]);
    await expect(service.acceptInvite('member', token)).rejects.toThrow('Invitation not found');
    expect(prisma.folderMember.upsert).not.toHaveBeenCalled();
  });

  it('requires ownership to list or remove members and atomically revokes invitation on removal', async () => {
    prisma.folder.findFirst.mockResolvedValue(null);
    await expect(service.getCollaboration('member', 'folder')).rejects.toThrow('Folder not found');
    prisma.folder.updateMany.mockResolvedValueOnce({ count: 0 });
    await expect(service.removeMember('member', 'folder', 'another')).rejects.toThrow('Folder not found');
    expect(prisma.folderMember.deleteMany).not.toHaveBeenCalled();
    await service.removeMember('owner', 'folder', 'member');
    expect(prisma.folder.updateMany).toHaveBeenLastCalledWith({ where: { id: 'folder', userId: 'owner', deletedAt: null }, data: { inviteTokenHash: null } });
    expect(prisma.folderMember.deleteMany).toHaveBeenCalledWith({ where: { folderId: 'folder', userId: 'member' } });
    expect(prisma.folder.updateMany.mock.invocationCallOrder.at(-1)).toBeLessThan(prisma.folderMember.deleteMany.mock.invocationCallOrder[0]);
  });

  it('lists member folders at the root without granting parent or subfolder access or exposing tokens', async () => {
    prisma.folder.findMany.mockResolvedValue([{ id: 'nested', userId: 'owner', parentId: 'private-parent' }]);
    expect(await service.findAll('member')).toEqual([{ id: 'nested', userId: 'owner', parentId: null, isOwner: false }]);
    expect(prisma.folder.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { deletedAt: null, OR: [{ userId: 'member' }, { members: { some: { userId: 'member' } } }] },
      omit: { inviteTokenHash: true, shareToken: true },
    }));
    // Folder modification stays owner-only, even though members can list the folder.
    prisma.folder.findFirst.mockResolvedValue(null);
    await expect(service.update('member', 'nested', { name: 'overwrite' })).rejects.toThrow('Folder not found');
    await expect(service.remove('member', 'nested')).rejects.toThrow('Folder not found');
  });

  it('never makes collaboration routes public', () => {
    for (const handler of ['acceptInvite', 'getCollaboration', 'enableInvite', 'disableInvite', 'removeMember'] as const) {
      expect(Reflect.getMetadata(IS_PUBLIC_KEY, FoldersController.prototype[handler])).not.toBe(true);
    }
  });
});
