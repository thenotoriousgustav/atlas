export type FolderRole = "VIEWER" | "CONTRIBUTOR" | "EDITOR"
export type FolderAccess = "OWNER" | FolderRole

export const folderRoles: { value: FolderRole; label: string; description: string }[] = [
  { value: "VIEWER", label: "Viewer", description: "Can view links and notes" },
  { value: "CONTRIBUTOR", label: "Contributor", description: "Can add items and edit their own" },
  { value: "EDITOR", label: "Editor", description: "Can add, edit, and remove any item" },
]

/** Folders without an access field come from older API responses and are treated as owned. */
export function folderAccess(folder?: { access?: FolderAccess; isOwner?: boolean } | null): FolderAccess {
  if (!folder) return "OWNER"
  return folder.access ?? (folder.isOwner === false ? "CONTRIBUTOR" : "OWNER")
}

/** Whether the user may add items to the folder. */
export function canAddToFolder(folder?: { access?: FolderAccess; isOwner?: boolean } | null) {
  return folderAccess(folder) !== "VIEWER"
}

export function describeFolderAccess(access: FolderAccess) {
  switch (access) {
    case "OWNER": return "Owner"
    case "EDITOR": return "Shared with you · Editor: you can add, edit, and remove any item"
    case "CONTRIBUTOR": return "Shared with you · Contributor: you can add items and edit your own"
    case "VIEWER": return "Shared with you · Viewer: you can view links and notes"
  }
}
