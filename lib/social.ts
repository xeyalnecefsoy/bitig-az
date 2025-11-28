export type User = {
  id: string;
  name: string;
  username: string;
  avatar: string;
  bio?: string;
  joinedAt?: string;
  followers?: number;
  following?: number;
};

export type Comment = {
  id: string
  userId: string
  content: string
  createdAt: string
}

export type Post = {
  id: string
  userId: string
  content: string
  createdAt: string
  likes: number
  likedByMe?: boolean
  comments: Comment[]
}

export const users: User[] = [
  {
    id: 'u1',
    name: 'Aysel Mammadova',
    username: 'aysel_m',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aysel',
  },
  {
    id: 'u2',
    name: 'Orkhan Aliyev',
    username: 'orkhan_a',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Orkhan',
  },
  {
    id: 'u3',
    name: 'Leyla Karimova',
    username: 'leyla_k',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Leyla',
  },
]

export const posts: Post[] = [
  {
    id: 'p1',
    userId: 'u1',
    content: 'Just finished The Martian. The narration pacing was perfect—made the problem-solving feel cinematic.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
    likes: 24,
    comments: [
      { id: 'c1', userId: 'u2', content: 'Agreed! The humor lands so well in audio.', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString() },
    ],
  },
  {
    id: 'p2',
    userId: 'u3',
    content: 'Atomic Habits on a morning walk hits different. Tiny habits, big compounding effect.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 30).toISOString(),
    likes: 31,
    comments: [],
  },
  {
    id: 'p3',
    userId: 'u2',
    content: 'Recommendations for rich worldbuilding? Thinking Dune or The Name of the Wind next.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    likes: 18,
    comments: [
      { id: 'c2', userId: 'u1', content: 'Dune is a masterpiece. The world feels lived-in.', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 47).toISOString() },
      { id: 'c3', userId: 'u3', content: 'Name of the Wind has beautiful prose.', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 46).toISOString() },
    ],
  },
]

export function getUser(id: string) {
  return users.find(u => u.id === id)
}

export function getPost(id: string) {
  return posts.find(p => p.id === id)
}
