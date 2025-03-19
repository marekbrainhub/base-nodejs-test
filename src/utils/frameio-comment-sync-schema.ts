import {
  InferType,
  object,
  string,
} from 'yup'

export const commentSyncWebhookPayloadSchema = object({
  project: object({ id: string().required() }),
  resource: object({ id: string().required(), type: string().oneOf(['comment']).required() }),
  team: object({ id: string().required() }),
  type: string().oneOf(['comment.created', 'comment.updated', 'comment.deleted', 'comment.completed', 'comment.uncompleted']).required(),
  user: object({ id: string().required() }),
})

export type CommentSyncWebhookPayload = InferType<typeof commentSyncWebhookPayloadSchema>
