import { FolderRole, type Prisma } from '@prisma/client';

// Membership covers this folder only, never its parent or children.
export function accessibleFolder(userId: string): Prisma.FolderWhereInput {
  return { deletedAt: null, OR: [{ userId }, { members: { some: { userId } } }] };
}

/** Folders the user may add items to: their own, or shared as Contributor or Editor. */
export function writableFolder(userId: string): Prisma.FolderWhereInput {
  return {
    deletedAt: null,
    OR: [{ userId }, { members: { some: { userId, role: { in: [FolderRole.CONTRIBUTOR, FolderRole.EDITOR] } } } }],
  };
}

/** Folders where the user may edit and trash anyone's links: their own, or shared as Editor. */
export function editableFolder(userId: string): Prisma.FolderWhereInput {
  return { deletedAt: null, OR: [{ userId }, { members: { some: { userId, role: FolderRole.EDITOR } } }] };
}

/**
 * Items the user may edit the content of and move to Trash: their own, plus other people's
 * links and notes in folders they own or edit.
 */
export function editableBookmark(userId: string): Prisma.BookmarkWhereInput {
  return { OR: [{ userId }, { folder: { is: editableFolder(userId) } }] };
}

/** Items the user may open: their own, plus everything in folders shared with them. */
export function viewableBookmark(userId: string): Prisma.BookmarkWhereInput {
  return { OR: [{ userId }, { folder: { is: accessibleFolder(userId) } }] };
}

/**
 * A link's "notes" field is its author's personal note; a note item's "notes" is the note's own
 * text and is shared with the folder like the rest of the note.
 */
export function shareableNoteFields<T extends { userId: string; type: string; notes?: string | null; noteDocument?: unknown }>(item: T, userId: string) {
  const visible = item.userId === userId || item.type === 'NOTE';
  return { notes: visible ? item.notes : null, noteDocument: visible ? item.noteDocument : null };
}

export type FolderAccess = 'OWNER' | FolderRole;

// Do not serialize invitation hashes or public sharing tokens through bookmark responses.
export const folderSummary = { id: true, name: true, userId: true, parentId: true } as const;
