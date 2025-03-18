import {
  API_URL,
  ICONIK_APP_ID,
} from 'src/config/env-vars.js'

export const ICONIK_CUSTOM_ACTION_URL_PATH = '/iconik/custom-action'

export const iconikCustomActionConfig = {
  title: 'Base NodeJS Test',
  app_id: ICONIK_APP_ID,
  type: 'POST',
  context: 'ASSET',
  url: `${API_URL}/api${ICONIK_CUSTOM_ACTION_URL_PATH}`,
}
