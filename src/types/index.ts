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
  content: string
  excerpt: string | null
  cover_image: string | null
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

// Like types
export interface Like {
  id: string
  post_id: string
  user_id: string
  created_at: string
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
