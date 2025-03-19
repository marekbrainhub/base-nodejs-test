import { handleCommentEvent } from 'src/use-cases/handle-comment-sync-action'
import { iconikCustomActionUseCase } from 'src/use-cases/iconik-custom-action-use-case.js'
import {
  amqpChannel,
  COMMENT_SYNC_QUEUE_NAME,
  CUSTOM_ACTION_QUEUE_NAME,
} from 'src/utils/amqp.js'
import { commentSyncWebhookPayloadSchema } from 'src/utils/frameio-comment-sync-schema'
import { iconikCustomActionPayloadSchema } from 'src/utils/iconik-custom-action-payload-schema.js'

await amqpChannel.consume(CUSTOM_ACTION_QUEUE_NAME, async (message) => {
  const payload = await iconikCustomActionPayloadSchema.validate(message!.content.toString())
  await iconikCustomActionUseCase(payload)
})

await amqpChannel.consume(COMMENT_SYNC_QUEUE_NAME, async (message) => {
  if (message) {
    try {
      const data = JSON.parse(message.content.toString())
      console.log('Processing comment sync:', data)
      const payload = await commentSyncWebhookPayloadSchema.validate(data)
      handleCommentEvent(payload)
      amqpChannel.ack(message)
    } catch (error) {
      console.error('Error processing message.');
      amqpChannel.nack(message, false, false);
    }
  }
})
