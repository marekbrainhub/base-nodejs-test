import { MongoClient } from 'mongodb'
import { MONGO_URI } from 'src/config/env-vars'

export const mongoDb = await MongoClient.connect(MONGO_URI)
export const db = mongoDb.db('base-nodejs-test')

export type AssetCollection = {
  iconikAssetId: string,
  frameIoAssetId: string,
}

export const assetCollection = db.collection<AssetCollection>('assets')

export type CommentCollection = {
  frameIoCommentId: string,
  iconikAssetId: string,
  iconikCommentId: string,
}

export const commentCollection = db.collection<CommentCollection>('comments')
