import 'source-map-support/register'
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import * as middy from 'middy'
import { cors, httpErrorHandler } from 'middy/middlewares'
// import { getUploadUrl } from '../../helpers/attachmentUtils'
import { createAttachmentPresignedUrl } from '../../helpers/todos'
import { getUserId } from '../utils'
// import { createLogger } from '../../utils/logger'
import * as AWS from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'

// const bucketName = process.env.ATTACHEMENTS_S3_BUCKET

const nameOfBucket = 'serverless-c4-todo-images-hakimks-dev';
// const logger = createLogger('generateUploadUrls')
const XAWS = AWSXRay.captureAWS(AWS)

const s3 = new XAWS.S3({
  signatureVersion: 'v4'
})

export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const todoId = event.pathParameters.todoId
    // TODO: Return a presigned URL to upload a file for a TODO item with the provided id
    console.log("Starting generate upload..")
    const userId = getUserId(event)
    console.log("Genrateurl: userId ", userId);
    
    const uploadUrl = getUploadUrl(todoId)
    console.log("Genrateurl: uploadurl", uploadUrl);
    
    
    const updatedTodo = {
      attachmentUrl: `https://${nameOfBucket}.s3.amazonaws.com/${todoId}`
    }

    await createAttachmentPresignedUrl(updatedTodo, userId, todoId);

    return {
      statusCode: 201,
      body: JSON.stringify({
        uploadUrl
      })
    }
    
  }
)

function getUploadUrl(todoId: string) {
  console.log("Genrateurl: bucket name", nameOfBucket);
  
  const url = s3.getSignedUrl('putObject', {
    Bucket: nameOfBucket,
    Key: todoId,
    Expires: 300
  })
  console.log("signed url - ", url);
  return url;
  
}

handler
  .use(httpErrorHandler())
  .use(
    cors({
      credentials: true
    })
  )
