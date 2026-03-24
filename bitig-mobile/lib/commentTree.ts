import type { Comment } from '@/lib/types'

export type CommentThread = Comment & { replies: CommentThread[] }

export function isCommentEdited(createdAt: string, updatedAt: string | null | undefined): boolean {
  if (updatedAt == null || String(updatedAt).trim() === '') return false
  const c = new Date(createdAt).getTime()
  const u = new Date(updatedAt).getTime()
  return Number.isFinite(c) && Number.isFinite(u) && u > c
}

export function buildCommentThreads(flat: Comment[]): CommentThread[] {
  const byId = new Map<string, CommentThread>()
  for (const c of flat) {
    byId.set(c.id, { ...c, replies: [] })
  }
  const roots: CommentThread[] = []
  for (const c of flat) {
    const node = byId.get(c.id)!
    if (c.parentCommentId) {
      const parent = byId.get(c.parentCommentId)
      if (parent) parent.replies.push(node)
      else roots.push(node)
    } else {
      roots.push(node)
    }
  }
  const sortTree = (nodes: CommentThread[]) => {
    nodes.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    for (const n of nodes) sortTree(n.replies)
  }
  sortTree(roots)
  return roots
}

export function getRootCommentsForPreview(flat: Comment[], limit: number): Comment[] {
  const roots = flat.filter((c) => !c.parentCommentId)
  roots.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  return roots.slice(0, limit)
}

export function collectSubtreeCommentIds(flat: Comment[], rootId: string): Set<string> {
  const byParent = new Map<string, string[]>()
  for (const c of flat) {
    if (c.parentCommentId) {
      if (!byParent.has(c.parentCommentId)) byParent.set(c.parentCommentId, [])
      byParent.get(c.parentCommentId)!.push(c.id)
    }
  }
  const ids = new Set<string>()
  const walk = (id: string) => {
    ids.add(id)
    for (const cid of byParent.get(id) || []) walk(cid)
  }
  walk(rootId)
  return ids
}
