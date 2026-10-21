import type { Prisma } from '@prisma/client';

// Membership covers this folder only, never its parent or children.
export function accessibleFolder(userId: string): Prisma.FolderWhereInput {
  return { deletedAt: null, OR: [{ userId }, { members: { some: { userId } } }] };
}

// Do not serialize invitation hashes or public sharing tokens through bookmark responses.
export const folderSummary = { id: true, name: true, userId: true, parentId: true } as const;
