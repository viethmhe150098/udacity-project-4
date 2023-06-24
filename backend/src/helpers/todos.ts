
import { getUploadUrl, deleteImageFromS3 } from './attachmentUtils';
import { TodoItem } from '../models/TodoItem'
import { CreateTodoRequest } from '../requests/CreateTodoRequest'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'
import { createLogger } from '../utils/logger'
import * as uuid from 'uuid'
import { addAttachItem, createItem, deleteItem, getItemById, getListByUserId, updateItem } from './todosAcess';
// import * as createError from 'http-errors'

const logger = createLogger('TodoBussinessLogic')

// TODO: Implement business Logic
export async function getTodoListService(userId: string) : Promise<TodoItem[]> {
  return await getListByUserId(userId)
}
//Create Item
export async function createTodoService(newTodo: CreateTodoRequest, userId: string) : Promise<TodoItem> {

  return await createItem({
    ...newTodo,
    userId,
    todoId: uuid.v4(),
    createdAt: new Date().toISOString(),
    done: false
  })
}

//Update Item
export async function updateTodoService(userId: string, todoId: string, todo: UpdateTodoRequest) {
  const todoItem: TodoItem = await getItemById(userId, todoId)
  if(!todoItem) {
    throw Error('TODO_NOT_FOUND')
  }

  await updateItem(userId, todoId, todo)
}

//Delete Item
export async function deleteTodoService(userId: string, todoId: string) {
  const todoItem: TodoItem = await getItemById(userId, todoId)
  if(!todoItem) {
    throw Error('ITEM_NOT_FOUND')
  }

  try{
    await deleteItem(userId, todoId)
  } catch (err) {
    logger.error(JSON.stringify(err))
    throw Error('CANT_DELETE_TODO')
  }

  const imageId = getImageIdFromUrl(todoItem.attachmentUrl)
  if(!imageId) return;

  try {
    await deleteImageFromS3(imageId)
  } catch (err) {
    logger.error(JSON.stringify(err))
    throw Error('CANT_DELETE_IMAGE')
  }
}

export async function generateUploadUrlService(userId: string, todoId: string) : Promise<string> {
  const imageId = uuid.v4()

  await addAttachItem(userId, todoId, imageId)

  const presignedUrl = getUploadUrl(imageId)
  return presignedUrl
}

function getImageIdFromUrl(imageUrl: string): string {
  if(!imageUrl) 
    return null;
  
  const sections = imageUrl.split('/')
  
  if(sections.length != 4) 
    return null

  return sections[3]
}