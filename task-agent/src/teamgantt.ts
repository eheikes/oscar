import got, { PlainResponse } from 'got'
import { getConfig } from './config'
import { log } from './log'

export interface Jwt {
  exp: number
}

export interface OAuthTokens {
  access_token: string
  id_token: string
  refresh_token: string
}

export interface Comment {
  added_by: {} // TODO
  added_date: string
  app: string
  attached_documents: [] // TODO
  id: number
  message: string
  project_id: number
  target: string
  target_id: string
  target_name: string
  type: string
  users_emailed: string[]
}

export interface Group {
  children: Task[]
  comment_info: {
    count: number
    has_unread: boolean
  }
  company_id: number
  document_info: {
    count: number
    edit_date: null // TODO
    has_unread: boolean
    view_date: null // TODO
  }
  id: number
  is_collapsed: boolean
  name: string
  parent_group_id: number | null
  parent_group_name: number | null
  project_id: number
  project_name: string
  project_permission: 'admin' // TODO
  sort: number
  type: 'group'
}

export interface NewTask {
  desc?: string
  due: Date
  groupId?: number
  name: string
  projectId: number
}

export interface Task {
  allow_scheduling_on_holidays: null // TODO
  checklist_info: {
    count: number
    completed: number
  }
  color: string
  comment_info: {
    count: number
    has_unread: boolean
  }
  company_id: number
  days: number
  dependencies: {
    parents: [] // TODO
    children: [] // TODO
  }
  document_info: {
    count: number
    edit_date: null // TODO
    view_date: null // TODO
    has_unread: boolean
  }
  end_date: string
  estimate: null // TODO
  estimated_hours: number
  expected_percent_complete: number
  has_tracked_time: boolean
  id: number
  is_estimated_hours_enabled: boolean
  is_starred: boolean
  is_time_tracking_enabled: boolean
  name: string
  parent_group_name: string
  project_id: number
  project_name: string
  type: string
  parent_group_id: number
  percent_complete: number
  project_is_starred: boolean
  project_permission: string
  resources: [] // TODO
  sort: number
  start_date: string
  wbs: string
  work_days_left: number
}

let authTokens: OAuthTokens | null = null

/**
 * Retrieves auth tokens.
 *
 * The first time it is called, the TeamGantt API is called to
 *   initiate the OAuth handshake and save the tokens.
 * For future calls, the existing tokens are returned.
 */
const getAuthTokens = async (): Promise<OAuthTokens> => {
  if (!authTokens) {
    const { teamgantt: { authUrl, clientId, clientSecret, username, password } } = await getConfig()
    const url = `${authUrl}/oauth2/token`
    const authHeader = `Basic ${btoa([clientId, clientSecret].join(':'))}`
    log('getAuthTokens', `Obtaining auth tokens ${url}`)
    try {
      authTokens = await got.post(url, {
        headers: {
          authorization: authHeader
        },
        form: {
          grant_type: 'password',
          username,
          password
        }
      }).json<OAuthTokens>()
    } catch (err) {
      log('getAuthTokens', 'ERROR!', err)
      throw err
    }
  }
  return authTokens
}

/**
 * Adds a note to the specified task.
 */
export const addNote = async (taskId: number, note: string): Promise<Comment> => {
  const { id_token: idToken } = await getAuthTokens()
  const { teamgantt: { apiUrl } } = await getConfig()
  const url = `${apiUrl}/tasks/${taskId}/comments`
  try {
    log('addNote', `Creating note on task ${taskId} ${url}`)
    const newNote = await got.post(url, {
      headers: {
        Authorization: `Bearer ${idToken}`
      },
      json: {
        type: 'note',
        message: note
      }
    }).json<Comment>()
    return newNote
  } catch (err: any) {
    log('addNote', 'ERROR!')
    if (err.response) {
      log('addNote', err.response.statusCode, err.response.body)
    }
    if (err instanceof Error) {
      log('addNote', err)
    }
    throw err
  }
}

export const addTask = async (task: NewTask): Promise<Task> => {
  const { id_token: idToken } = await getAuthTokens()
  const { teamgantt: { apiUrl } } = await getConfig()
  const url = `${apiUrl}/tasks`
  try {
    log('addTask', `Creating task ${url}`)
    const month = `${task.due.getMonth() + 1}`.padStart(2, '0')
    const date = `${task.due.getDate()}`.padStart(2, '0')
    const dueYmd = `${task.due.getFullYear()}-${month}-${date}`
    const newTask = await got.post(url, {
      headers: {
        Authorization: `Bearer ${idToken}`
      },
      json: {
        project_id: task.projectId,
        parent_group_id: task.groupId,
        name: task.name,
        type: 'task',
        start_date: dueYmd,
        end_date: dueYmd
      }
    }).json<Task>()
    if (task.desc) {
      await addNote(newTask.id, task.desc)
    }
    return newTask
  } catch (err: any) {
    log('addTask', 'ERROR!')
    if (err.response) {
      log('addTask', err.response.statusCode, err.response.body)
    }
    if (err instanceof Error) {
      log('addTask', err)
    }
    throw err
  }
}

export const getProjectGroups = async (projectId: number): Promise<Group[]> => {
  const { id_token: idToken } = await getAuthTokens()
  const { teamgantt: { apiUrl } } = await getConfig()
  const url = `${apiUrl}/groups?project_ids=${projectId}`
  try {
    log('getProjectGroups', `Getting project groups ${url}`)
    const groups = await got.get(url, {
      headers: {
        Authorization: `Bearer ${idToken}`
      }
    }).json<Group[]>()
    return groups
  } catch (err: any) {
    log('getProjectGroups', 'ERROR!', err)
    if (err.response) {
      log('getProjectGroups', err.response.statusCode, err.response.body)
    }
    if (err instanceof Error) {
      log('getProjectGroups', err)
    }
    throw err
  }
}
