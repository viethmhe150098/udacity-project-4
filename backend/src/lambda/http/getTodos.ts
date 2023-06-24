import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import middy from '@middy/core';
import cors from '@middy/http-cors'

import { getTodoListService } from '../../helpers/todos'
import { getUserId } from '../utils';

// TODO: Get all TODO items for a current user
export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    
    const userId = getUserId(event)

    const todoList = await getTodoListService(userId)

    return {
      statusCode: 200,
      body: JSON.stringify({
        items: todoList
      })
    }
  }
)

handler.use(
  cors({
    credentials: true
  })
)
