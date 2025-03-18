import 'dotenv/config'
import { object, string } from 'yup'

export const {
  AMQP_URL,
  MONGO_URI,
  API_URL,
  ICONIK_APP_ID,
  ICONIK_AUTH_TOKEN,
  ICONIK_CUSTOM_ACTION_ID,
  FRAME_IO_ACCESS_TOKEN,
  FRAME_IO_ROOT_ASSET_ID,
  FRAME_IO_WEBHOOK_SECRET,
} = object({
  AMQP_URL: string().required(),
  MONGO_URI: string().required(),
  API_URL: string().url().required(),
  ICONIK_APP_ID: string().uuid().required(),
  ICONIK_AUTH_TOKEN: string().required(),
  ICONIK_CUSTOM_ACTION_ID: string().uuid(),
  FRAME_IO_ACCESS_TOKEN: string().required(),
  FRAME_IO_ROOT_ASSET_ID: string().uuid().required(),
  FRAME_IO_WEBHOOK_SECRET: string().required(),
}).validateSync(process.env)
