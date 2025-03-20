import { handleCommentEvent } from 'src/use-cases/handle-comment-sync-action'
import { copyIconikAssetToFrameIo } from 'src/use-cases/copy-iconik-asset-to-frame-io'
import {
  amqpChannel,
  COMMENT_SYNC_QUEUE_NAME,
  CUSTOM_ACTION_QUEUE_NAME,
} from 'src/utils/amqp.js'
import { commentSyncWebhookPayloadSchema } from 'src/utils/frameio-comment-sync-schema'
import { iconikCustomActionPayloadSchema } from 'src/utils/iconik-custom-action-payload-schema.js'

await amqpChannel.consume(CUSTOM_ACTION_QUEUE_NAME, async (message) => {
  const payload = await iconikCustomActionPayloadSchema.validate(message!.content.toString())
  await copyIconikAssetToFrameIo(payload)
})

await amqpChannel.consume(COMMENT_SYNC_QUEUE_NAME, async (message) => {
  if (message) {
    try {
      const data = JSON.parse(message.content.toString())
      const payload = await commentSyncWebhookPayloadSchema.validate(data)
      handleCommentEvent(payload)
      amqpChannel.ack(message)
    } catch (error) {
      console.error('Error processing message.');
      amqpChannel.nack(message, false, false);
    }
  }
})
