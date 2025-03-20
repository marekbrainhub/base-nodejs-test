import { FRAME_IO_ROOT_ASSET_ID } from 'src/config/env-vars.js'
import { frameIoClient } from 'src/utils/frame-io-client.js'
import { iconikClient } from 'src/utils/iconik-client.js'
import { IconikCustomActionPayload } from 'src/utils/iconik-custom-action-payload-schema.js'
import { assetCollection } from 'src/utils/mongo-db.js'

export async function copyIconikAssetToFrameIo(payload: IconikCustomActionPayload) {
  const assetId = payload.asset_ids[0]

  const { data: iconikAsset } = await iconikClient.get(`/assets/v1/assets/${assetId}`)

  const proxiesResponse = await iconikClient.get(
    `/files/v1/assets/${assetId}/versions/${iconikAsset.versions[0].id}/proxies/`,
    { params: { per_page: 1, generate_signed_url: true, content_disposition: 'attachment' } },
  )

  const proxy = proxiesResponse.data.objects[0]

  const { data: frameIoAsset } = await frameIoClient.post(`/assets/${FRAME_IO_ROOT_ASSET_ID}/children`, {
      name: iconikAsset.title,
      type: 'file',
      filesize: proxy.size ?? undefined,
      source: {
        url: proxy.url
      }
    }
  )

  await assetCollection.insertOne({
    iconikAssetId: iconikAsset.id,
    frameIoAssetId: frameIoAsset.id,
  })
}
