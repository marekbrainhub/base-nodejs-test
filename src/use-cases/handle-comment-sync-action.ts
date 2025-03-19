import { assetCollection } from "src/utils/mongo-db";
import { iconikClient } from "src/utils/iconik-client";
import { frameIoClient } from "src/utils/frame-io-client";
import { commentSyncWebhookPayloadSchema, type CommentSyncWebhookPayload } from "src/utils/frameio-comment-sync-schema";
import type { AssetCollection } from "./iconik-custom-action-use-case";

type Comment = {
  id: string,
  asset_id: string,
  owner: {
    email: string,
    name: string,
  },
  text: string,
}

export const handleCommentEvent = async (event: CommentSyncWebhookPayload) => {
 try {
    const comment = await frameIoClient.get<Comment>(`comments/${event.resource.id}`)
    const frameIoAssetId = comment.data.asset_id

    const mapping = await assetCollection.findOne<AssetCollection>({ frameIoAssetId })

    if (!mapping) {
      console.warn(`No mapping found for Frame.io asset ${frameIoAssetId}`);
      return;
    }

    const iconikAssetId = mapping.iconikAssetId;

    switch(event.type) {
      case 'comment.created':
        await createIconikComment(iconikAssetId, comment.data)
    }
  } catch (error: any) {
    console.log('Caught error')
    if (error.response) {
      console.error(error.response.status, error.response.path, error.response.data)
    } else {
      console.error(error)
      throw error
    }
  }
}

const createIconikComment = async (iconikAssetId: string, comment: Comment) => {
  const body = {
    external_id: `frameio:${comment.id}`,
    segment_type: 'COMMENT',
    segment_text: comment.text
  }

  const response = await iconikClient.post(
    `/assets/v1/assets/${iconikAssetId}/segments`,
    body,
  )

  console.log(`Created comment on Iconik asset`)
  console.log(response.data)
}
