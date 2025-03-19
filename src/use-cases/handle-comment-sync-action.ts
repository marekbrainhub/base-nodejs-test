import { assetCollection, commentCollection } from "src/utils/mongo-db";
import { iconikClient } from "src/utils/iconik-client";
import { frameIoClient } from "src/utils/frame-io-client";
import { type CommentSyncWebhookPayload } from "src/utils/frameio-comment-sync-schema";
import { AxiosError } from "axios";

type Comment = {
  id: string,
  asset_id: string,
  completed: boolean,
  owner: {
    email: string,
    name: string,
  },
  text: string,
}

export const handleCommentEvent = async (event: CommentSyncWebhookPayload) => {
 try {
    console.log(`Processing ${event.type} event for resource ${event.resource.id}`);

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
        break
      case 'comment.updated':
      case 'comment.completed':
      case 'comment.uncompleted':
        await updateIconikComment(comment.data)
        break
    }
  } catch (error: unknown) {
    console.log('Caught error')
    if (error instanceof AxiosError && error.response) { // Axios error
      console.error(error.response.status, error.response.data)
    } else {
      console.error(error)
      throw error
    }
  }
}

const createIconikComment = async (iconikAssetId: string, comment: Comment) => {
  const body = {
    segment_type: 'COMMENT',
    segment_text: comment.text,
    user_info: {
      email: comment.owner.email,
      first_name: comment.owner.name,
    }
  }

  const response = await iconikClient.post(
    `/assets/v1/assets/${iconikAssetId}/segments`,
    body,
  )

  if (response.data && response.data.id) {
    await commentCollection.insertOne({
      frameIoCommentId: comment.id,
      iconikAssetId,
      iconikCommentId: response.data.id,
    })

    console.log(`Created comment on Iconik asset ${iconikAssetId}`)
  } else {
    console.error('Failed to get valid response from Iconik when creating comment.')
  }

}

const updateIconikComment = async (comment: Comment) => {
  const body = {
    segment_type: 'COMMENT',
    segment_text: comment.text,
    segment_checked: comment.completed,
  }

  const mapping = await commentCollection.findOne({ frameIoCommentId: comment.id })

  if (!mapping) {
    console.warn(`No matching Iconik comment found for Frame.io comment ${comment.id}`)
    return;
  }

  const { iconikAssetId, iconikCommentId } = mapping

  const response = await iconikClient.patch(
    `/assets/v1/assets/${iconikAssetId}/segments/${iconikCommentId}`,
    body,
  )

  console.log(`Updated Iconik comment ${iconikCommentId} on Iconik asset ${iconikAssetId}`)
}

const deleteIconikComment = async (frameIoCommentId: string) => {
  const mapping = await commentCollection.findOne({ frameIoCommentId })

  if (!mapping) {
    console.warn(`No matching Iconik comment found for Frame.io comment ${frameIoCommentId}`)
    return;
  }

  const { iconikCommentId, iconikAssetId } = mapping

  await iconikClient.delete(`/assets/v1/assets/${iconikAssetId}/segments/${iconikCommentId}`)
  await commentCollection.deleteOne({ frameIoCommentId })

  console.log(`Deleted Iconik comment ${iconikCommentId} on Iconik asset ${iconikAssetId}`)
}
