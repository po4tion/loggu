import { z } from 'zod'

export const commentSchema = z.object({
  content: z
    .string()
    .min(1, '댓글 내용을 입력하세요')
    .max(2000, '댓글은 2000자 이하여야 합니다'),
})

export type CommentFormData = z.infer<typeof commentSchema>
