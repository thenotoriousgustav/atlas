import { closestCenter, pointerWithin, type CollisionDetection } from "@dnd-kit/core"
import type { SortingStrategy } from "@dnd-kit/sortable"

// Masonry owns variable-height positioning; grid slot transforms would overlap cards.
export const masonrySortingStrategy: SortingStrategy = () => null

export const bookmarkCollisionDetection: CollisionDetection = (args) => {
  if (!args.pointerCoordinates) return closestCenter(args)
  const hits = pointerWithin(args)
  if (hits.length) return hits

  const cards = args.droppableContainers.filter((item) => item.data.current?.type !== "folder")
  const rects = cards.flatMap((item) => {
    const rect = args.droppableRects.get(item.id)
    return rect ? [rect] : []
  })
  const { x, y } = args.pointerCoordinates
  if (!rects.length || x < Math.min(...rects.map((r) => r.left)) ||
    x > Math.max(...rects.map((r) => r.right)) ||
    y < Math.min(...rects.map((r) => r.top)) || y > Math.max(...rects.map((r) => r.bottom))) return []
  return closestCenter({ ...args, droppableContainers: cards })
}
