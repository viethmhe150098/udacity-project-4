import * as AWS from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk-core'
// import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { createLogger } from '../utils/logger'
import { TodoItem } from '../models/TodoItem'
import { TodoUpdate } from '../models/TodoUpdate';

const XAWS = AWSXRay.captureAWS(AWS)

const TODOS_TABLE = process.env.TODOS_TABLE
const ATTACHMENT_S3_BUCKET = process.env.ATTACHMENT_S3_BUCKET
const TODOS_USER_ID_INDEX = process.env.TODOS_USER_ID_INDEX

const docClient = createDynamoDBClient()
const logger = createLogger('TodosAccess')

// TODO: Implement the dataLayer logic
export async function getItemById(userId: string, todoId: string) : Promise<TodoItem | undefined> {
    logger.info(`get todo ${todoId}`)
    
    const result = await docClient.get({
        TableName: TODOS_TABLE,
        Key: { userId, todoId }
    }).promise()
    
    
    return result.Item as TodoItem
}

export async function getListByUserId(userId: string) : Promise<TodoItem[]> {
    logger.info(`user ${userId} get todos`)

    const result = await docClient.query({
            TableName: TODOS_TABLE,
            IndexName: TODOS_USER_ID_INDEX,
            KeyConditionExpression: 'userId = :userId',
            ExpressionAttributeValues: {
                ':userId': userId
            }
        }).promise()
    
    return result.Items as TodoItem[]
}

export async function createItem(todo : TodoItem) : Promise<TodoItem> {
    logger.info(`create todo ${JSON.stringify(todo)}`)
    
    await docClient.put({
        TableName: TODOS_TABLE,
        Item: todo
    }).promise()

    return todo
}

export async function updateItem(userId: string, todoId: string, todo: TodoUpdate) {
    logger.info(`update todo ${todoId}: ${JSON.stringify(todo)}`)

    await docClient.update({
        TableName: TODOS_TABLE,
        Key: { userId, todoId },
        UpdateExpression: 'set #n = :name, dueDate = :dueDate, done = :done',
        ExpressionAttributeNames: { '#n': 'name' },
        ExpressionAttributeValues: {
            ':name' : todo.name,
            ':dueDate': todo.dueDate,
            ':done': todo.done
        }
    }).promise()
}

export async function addAttachItem(userId:string, todoId: string, imageId: string) {
    logger.info(`add attachment for TODO ${todoId} with imageId ${imageId}`)

    const imageUrl = `https://${ATTACHMENT_S3_BUCKET}.s3.amazonaws.com/${imageId}`

    await docClient.update({
        TableName: TODOS_TABLE,
        Key: { userId, todoId },
        UpdateExpression: 'set attachmentUrl = :imageUrl',
        ExpressionAttributeValues: {
            ':imageUrl' : imageUrl
        }
    }).promise()
}

export async function deleteItem(userId: string, todoId: string) {
    logger.info(`delete todo ${todoId}`)

    await docClient.delete({
        TableName: TODOS_TABLE,
        Key: { userId, todoId }
    }).promise()
}

function createDynamoDBClient() {
    if (process.env.IS_OFFLINE) {
        console.log('DynamoDB client is creating')
        return new XAWS.DynamoDB.DocumentClient({
            region: 'localhost',
            endpoint: 'http://localhost:8000'
        })
    }
  
    return new XAWS.DynamoDB.DocumentClient()
}