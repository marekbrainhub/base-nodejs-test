import crypto from 'crypto'
import { FRAME_IO_WEBHOOK_SECRET } from 'src/config/env-vars'

/** @see https://developer.frame.io/docs/automations-webhooks/webhooks-overview#h3-section-verify-webhook-signatures */
export const verifyFrameioWebhook = (body: string, signature: string, timestamp: string) => {
  const hmac1 = crypto.createHmac('sha256', FRAME_IO_WEBHOOK_SECRET)
  const generateSignature = hmac1.update(`v0:${timestamp}:${body}`).digest('hex')
  return signature === `v0=${generateSignature}`
}
