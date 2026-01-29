// Re-export database types
export type { Database, Tables, TablesInsert, TablesUpdate } from './database.types'

// User/Profile types
export interface Profile {
  id: string
  username: string
  display_name: string | null
  bio: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

// Post types
export interface Post {
  id: string
  author_id: string
  title: string
  slug: string
  content: string | null
  excerpt: string | null
  cover_image_url: string | null
  published: boolean
  views: number
  created_at: string
  updated_at: string
  published_at: string | null
}

export interface PostWithAuthor extends Post {
  author: Profile
}

export interface PostWithTags extends Post {
  tags: Tag[]
}

export interface PostWithAuthorAndTags extends Post {
  author: Profile
  tags: Tag[]
}

// Tag types
export interface Tag {
  id: string
  name: string
  slug: string
  created_at: string
}

// Comment types
export interface Comment {
  id: string
  post_id: string
  author_id: string
  parent_id: string | null
  content: string
  created_at: string
  updated_at: string
}

export interface CommentWithAuthor extends Comment {
  author: Profile
}

export interface CommentWithReplies extends CommentWithAuthor {
  replies: CommentWithAuthor[]
}

// Like types
export interface Like {
  user_id: string
  post_id: string
  created_at: string
}

// RPC function return types
export interface PostWithTagsRpcResult {
  id: string
  title: string
  slug: string
  excerpt: string | null
  cover_image_url: string | null
  published_at: string | null
  views: number
  author_username: string
  author_display_name: string | null
  author_avatar_url: string | null
  likes_count: number
  tags: string | null // JSON string of tag names
}

// API Response types
export interface ApiResponse<T> {
  data: T | null
  error: string | null
}

export interface PaginatedResponse<T> {
  data: T[]
  count: number
  page: number
  pageSize: number
  totalPages: number
}
