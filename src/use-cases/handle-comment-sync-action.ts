import { assetCollection, commentCollection } from "src/utils/mongo-db";
import { iconikClient } from "src/utils/iconik-client";
import { frameIoClient } from "src/utils/frame-io-client";
import { type CommentSyncWebhookPayload } from "src/utils/frameio-comment-sync-schema";

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
    // If it's a deleted comment then we can't look it up in the API.
    if (event.type === 'comment.deleted') {
      return deleteIconikComment(event.resource.id)
    }

    const comment = await frameIoClient.get<Comment>(`comments/${event.resource.id}`)
    const frameIoAssetId = comment.data.asset_id

    const mapping = await assetCollection.findOne({ frameIoAssetId })

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

  await commentCollection.insertOne({
    frameIoCommentId: comment.id,
    iconikAssetId,
    iconikCommentId: response.data.id,
  })

  console.log(`Created comment on Iconik asset ${iconikAssetId}`)
}

const deleteIconikComment = async (frameIoCommentId: string) => {
  const mapping = await commentCollection.findOne({ frameIoCommentId })

  if (!mapping) {
    console.warn(`No matching Iconik comment found for Frame.io comment ${frameIoCommentId}`)
    return;
  }

  const { iconikCommentId, iconikAssetId } = mapping

  await iconikClient.delete(`/assets/v1/assets/${iconikAssetId}/segments/${iconikCommentId}`)
  await commentCollection.deleteOne({ iconikCommentId })

  console.log(`Deleted Iconik comment ${iconikCommentId} on Iconik asset ${iconikAssetId}`)
}
