
import { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { createS3Client, getBucketConfig } from './aws-config'

const s3Client = createS3Client()
const { bucketName, folderPrefix } = getBucketConfig()

export async function uploadFile(buffer: Buffer, fileName: string, contentType: string): Promise<string> {
  const key = `${folderPrefix}${fileName}`
  
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: buffer,
    ContentType: contentType
  })

  await s3Client.send(command)
  
  // Return the full key as cloud_storage_path
  return key
}

export async function getFileUrl(key: string, expiresIn: number = 3600): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: key
  })

  const url = await getSignedUrl(s3Client, command, { expiresIn })
  return url
}

export async function deleteFile(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: bucketName,
    Key: key
  })

  await s3Client.send(command)
}
