import { getDatabaseConnection } from './database.js'

export interface DatabaseUser {
  created_at: string
  deleted_at: string | null
  email: string | null
  id: string
  name: string
  nickname: string
  updated_at: string
}

declare module 'knex/types/tables.js' {
  interface Tables {
    users: DatabaseUser
  }
}

export interface User {
  createdAt: Date
  deletedAt: Date | null
  email: string | null
  id: string
  name: string
  nickname: string
  updatedAt: Date
}

// const userFieldMapping: Record<keyof User, keyof DatabaseUser> = {
//   createdAt: 'created_at',
//   deletedAt: 'deleted_at',
//   email: 'email',
//   id: 'id',
//   name: 'name',
//   nickname: 'nickname',
//   updatedAt: 'updated_at'
// }

export const getUserById = async (id: string): Promise<User | null> => {
  if (typeof id !== 'string') { return null }
  const db = getDatabaseConnection()
  const result = await db.select('*').from('users').where('id', id)
  if (result.length === 0) { return null }
  const row = result[0]
  return {
    createdAt: new Date(row.created_at),
    deletedAt: row.deleted_at === null ? /* c8 ignore next */ null : new Date(row.deleted_at),
    email: row.email,
    id: row.id,
    name: row.name,
    nickname: row.nickname,
    updatedAt: new Date(row.updated_at)
  }
}
