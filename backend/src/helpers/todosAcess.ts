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
const bucketName = process.env.ATTACHMENT_S3_BUCKET
const urlExpiration = process.env.SIGNED_URL_EXPIRATION
const logger = createLogger('TodosAccess')

// TODO: Implement the dataLayer logic
export class TodosAccess {
    constructor(
        private readonly docClient: DocumentClient = new AWS.DynamoDB.DocumentClient(),
        private readonly todoTable = process.env.TODO_TABLE
    ) {
    }


    async getAllToDos(userID: string): Promise<TodoItem[]> {
        console.log(this.todoTable);
        logger.info("UserId", userID)
        const result = await this.docClient
            .query({
                TableName: this.todoTable,
                //IndexName: 'index-name',
                KeyConditionExpression: 'userId = :paritionKey',
                ExpressionAttributeValues: {
                    ':paritionKey': userID
            }

            }).promise();
            const items = result.Items;
            console.log(items)
            return items as TodoItem[];
    }

    async createTodo(todoItem: TodoItem): Promise<TodoItem> {
        await this.docClient.put({
            TableName: this.todoTable,
            Item: todoItem
        }).promise()
        console.log("item", todoItem)
        return todoItem
    }

    async updateTodo(updatedTodo: TodoUpdate, userId: string, todoId: string): Promise<TodoUpdate> {


        var params = {
            TableName: this.todoTable,
            Key: {
                "userId": userId,
                "todoId": todoId

            },
            UpdateExpression: "set #name_todo = :n,#dueDate_todo = :dd,#done_todo = :dn",
            ExpressionAttributeValues: {
                ":n": updatedTodo.name.toString(),
                ":dd": updatedTodo.dueDate.toString(),
                ":dn": "true" === updatedTodo.done.toString()
            },
            ExpressionAttributeNames: {
                "#name_todo": "name",
                "#dueDate_todo": "dueDate",
                "#done_todo": "done"

            },
            ReturnValues: "UPDATED_NEW"
        };

        await this.docClient.update(params, function (err, data) {
            if (err) {
                console.error("Unable to update item. Error JSON:", JSON.stringify(err, null, 2));
                return {
                    statusCode: 404,
                    headers: {
                        'Access-Control-Allow-Origin': '*'
                    },
                    body: 'Unable to delete'

                }
            } else {
                console.log("UpdateItem succeeded:", JSON.stringify(data, null, 2));
            }
        }).promise();

        return updatedTodo

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
            Bucket: bucketName,
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

