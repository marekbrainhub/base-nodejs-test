import express from 'express'
import { FRAMEIO_WEBHOOK_URL_PATH } from 'src/config/frameio-webhook'
import { ICONIK_CUSTOM_ACTION_URL_PATH } from 'src/config/iconik-custom-action.js'
import {
  amqpChannel,
  CUSTOM_ACTION_MESSAGE_TYPE,
  COMMENT_SYNC_MESSAGE_TYPE,
  TOPIC_NAME,
} from 'src/utils/amqp.js'
import { commentSyncWebhookPayloadSchema } from 'src/utils/frameio-comment-sync-schema'
import { verifyFrameioWebhook } from 'src/utils/frameio-verify-webhook'
import { iconikCustomActionPayloadSchema } from 'src/utils/iconik-custom-action-payload-schema.js'

export const apiRouter = express.Router()

apiRouter.get('/health', (req, res) => {
  res.sendStatus(200)
})

apiRouter.post(ICONIK_CUSTOM_ACTION_URL_PATH, async (req, res) => {
  console.log('Received custom action request')
  const payload = await iconikCustomActionPayloadSchema.validate(req.body)
  amqpChannel.publish(TOPIC_NAME, CUSTOM_ACTION_MESSAGE_TYPE, Buffer.from(JSON.stringify(payload)))
  res.status(202).json({ status: 'Accepted' })
})

apiRouter.post(FRAMEIO_WEBHOOK_URL_PATH, async (req, res) => {
  console.log('Received frame.io webhook request.')

  const timestamp = req.get('X-Frameio-Request-Timestamp')
  const signature = req.get('X-Frameio-Signature')

  if (!signature || !timestamp || !verifyFrameioWebhook(JSON.stringify(req.body), signature, timestamp)) {
    res.status(401).json({ status: 'Unauthorized', message: 'Invalid signature' })
    return
  }

  const payload = await commentSyncWebhookPayloadSchema.validate(req.body)

  amqpChannel.publish(TOPIC_NAME, COMMENT_SYNC_MESSAGE_TYPE, Buffer.from(JSON.stringify(payload)))

  res.status(202).json({ status: 'Accepted' })
})
