import { TodosAccess } from './todosAcess'
// import { AttachmentUtils } from './attachmentUtils';
import { TodoItem } from '../models/TodoItem'
import { CreateTodoRequest } from '../requests/CreateTodoRequest'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'
import { createLogger } from '../utils/logger'
import * as uuid from 'uuid'
// import * as createError from 'http-errors'
const logger = createLogger('todos')

// TODO: Implement businessLogic
const todoAccess = new TodosAccess()

export async function getTodosForUser(userId: string): Promise<TodoItem[]>{
    return todoAccess.getTodosForUser(userId)
}

export async function createTodo(createTodoRequest: CreateTodoRequest, userId: string): Promise<TodoItem>{
    const createdAt = new Date().toISOString()
    const todoId = uuid.v4()
    logger.info("todoId", todoId)
    return await todoAccess.createTodo({
        userId,
        todoId,
        createdAt,
        name: createTodoRequest.name,
        dueDate: createTodoRequest.dueDate,
        done: false,
    })
}

export async function updateTodo(updateTodoRequest: UpdateTodoRequest, userId: string, todoId: string) {

    return await todoAccess.updateTodo(updateTodoRequest, userId, todoId);
}

export async function deleteTodo(userId: string, todoId: string){
    return await todoAccess.deleteTodo(userId, todoId)
}

export async function createAttachmentPresignedUrl(updateTodo, userId: string, todoId: string): Promise<TodoItem>{
    return await todoAccess.createAttachmentPresignedUrl({
      userId,
      todoId,
      attachmentUrl: updateTodo.attachmentUrl,
    })
  }