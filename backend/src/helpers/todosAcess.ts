import * as AWS from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { createLogger } from '../utils/logger'
import { TodoItem } from '../models/TodoItem'
import { TodoUpdate } from '../models/TodoUpdate';

const XAWS = AWSXRay.captureAWS(AWS)
const s3 = new XAWS.S3({
    signatureVersion: 'v4'
  })
const urlExpiration = process.env.SIGNED_URL_EXPIRATION
const logger = createLogger('TodosAccess')

// TODO: Implement the dataLayer logic
export class TodosAccess {
    constructor(
        private readonly docClient: DocumentClient = new AWS.DynamoDB.DocumentClient({apiVersion: '2012-08-10'}),
        private readonly todoTable = process.env.TODOS_TABLE,
        private readonly indexName = process.env.TODOS_CREATED_AT_INDEX,
        private readonly bucketName = process.env.ATTACHMENT_S3_BUCKET
    ) {
    }

    // gets all todos
    async getTodosForUser(userId: string): Promise<TodoItem[]> {
        console.log('Getting all todos')
        logger.info("UserId", userId)
        const result = await this.docClient.query({
          TableName: this.todoTable,
          IndexName: this.indexName,
          KeyConditionExpression: 'userId = :userId',
          ExpressionAttributeValues: {
              ':userId': userId
          }
        }).promise()
          
        const items = result.Items
    
        return items as TodoItem[]
      }

    async createTodo(todoItem: TodoItem): Promise<TodoItem> {
        await this.docClient.put({
            TableName: this.todoTable,
            Item: todoItem
        }).promise()
        console.log("item", todoItem)
        return todoItem
    }

    async updateTodo(todo: TodoUpdate, todoId: string, userId: string) {
        logger.info(`Updating a todo`, {
          todoId: todoId,
          userId: userId
        });
    
        const params = {
          TableName: this.todoTable,
          Key: {
            userId: userId,
            todoId: todoId
          },
          ExpressionAttributeNames: {
            '#todo_name': 'name',
          },
          ExpressionAttributeValues: {
            ':name': todo.name,
            ':dueDate': todo.dueDate,
            ':done': todo.done,
          },
          UpdateExpression: 'SET #todo_name = :name, dueDate = :dueDate, done = :done',
          ReturnValues: 'ALL_NEW',
        };
    
        const result = await this.docClient.update(params).promise();
    
        logger.info(`Update statement has completed without error`, { result: result });
    
        return result.Attributes as TodoItem;
      }
    
      async updateTodoUrl(todoId: string, userId: string) {
        logger.info(`Updating a todo's URL for item:`, {
          todoId: todoId,
          userId: userId
        });
    
        const url = `https://${this.bucketName}.s3.amazonaws.com/${todoId}`;
    
        const params = {
          TableName: this.todoTable,
          Key: {
            userId: userId,
            todoId: todoId
          },
          ExpressionAttributeNames: {
            '#todo_attachmentUrl': 'attachmentUrl'
          },
          ExpressionAttributeValues: {
            ':attachmentUrl': url
          },
          UpdateExpression: 'SET #todo_attachmentUrl = :attachmentUrl',
          ReturnValues: 'ALL_NEW',
        };
    
        const result = await this.docClient.update(params).promise();
    
        logger.info(`Update statement has completed without error`, { result: result });
    
        return result.Attributes as TodoItem;
      }
    
    async deleteTodo(userId: string, todoId: string) {
        const params = {
            TableName: this.todoTable,
            Key: {
              todoId, 
              userId
            }
          }
        await this.docClient.delete(params, function(err, data) {
          if (err) {
              console.error("Unable to delete item", JSON.stringify(err))
          }
          else {
              console.log("Item deleted successfully!", JSON.stringify(data))
          }
        }).promise()
        
      }

      async createAttachmentPresignedUrl(todoId: string): Promise<string> {
        console.log("Generating URL");

        const url = s3.getSignedUrl('putObject', {
            Bucket: this.bucketName,
            Key: todoId,
            Expires: urlExpiration,
        });
        console.log(url);

        return url as string;
    }
    

}
  

// function createDynamoDBClient() {
//     if (process.env.IS_OFFLINE) {
//         console.log("Creating a local DynamoDB instance");
//         return new XAWS.DynamoDB.DocumentClient({
//             region: "localhost",
//             endpoint: "http://localhost:8000"
//         });
//     }
//     return new XAWS.DynamoDB.DocumentClient();
// }

