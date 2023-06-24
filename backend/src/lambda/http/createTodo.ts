import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import 'source-map-support/register'
import middy from '@middy/core';
import cors from '@middy/http-cors'
import { createLogger } from '../../utils/logger'
import { CreateTodoRequest } from '../../requests/CreateTodoRequest'
import { getUserId } from '../utils';
import { createTodoService } from '../../helpers/todos';

const logger = createLogger('HTTP_CreateTodo')

export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    // TODO: Implement creating a new TODO item
    logger.info(`Todo to create: $${event.body}`)

    const newTodo: CreateTodoRequest = JSON.parse(event.body)
    const userId: string = getUserId(event)

    const item = await createTodoService(newTodo, userId)

    return {
      statusCode: 201,
      body: JSON.stringify({
        item
      })
    }
  }
)

handler.use(
  cors({
    credentials: true
  })
)
