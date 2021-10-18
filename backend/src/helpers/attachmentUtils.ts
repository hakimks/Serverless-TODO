import * as AWS from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'

const XAWS = AWSXRay.captureAWS(AWS)

// TODO: Implement the fileStogare logic
const s3 = new XAWS.S3({
    signatureVersion: 'v4'
  })
  
  // const bucketName = process.env.ATTACHEMENTS_S3_BUCKET
  // const urlExpiration = process.env.SIGNED_URL_EXPIRATION

  export function getUploadUrl(todoId: string, bucketName: string){
    return s3.getSignedUrl('putObject', {
        Bucket: bucketName,
        Key: todoId,
        Expires: 3000
      })
  }
  
