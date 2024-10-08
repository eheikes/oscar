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

/**
 * Not a complete list
 */
export interface Project {
  company_id: number
  id: number
  project_id: number
  project_status: 'active' | 'on hold' | 'complete'
  user_id: number
}

export interface Resource {
  color: string | null
  hours_per_day: number
  id: number
  is_disabled: boolean
  name: string
  pic: string
  project_id: number
  task_id: number
  total_hours: number
  type: 'company' | 'project' | 'user'
  type_id: number

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

export interface User {
  // TODO
}

const ONE_DAY = 60 * 60 * 24 * 1000

const personalDailiesGroup = 29857733
const dailyChoresGroup = 29838997
const excludedGroups = [
  30211106, // game dev - i spy
  29857649, // health - appts
  29857657, // health - research
  30088708, // house - energy efficiency
  29850847, // house - misc repairs
  30088221, // ollie - education
  30795110, // ollie - misc
  29868670, // personal - gallery
  30021667, // personal - fun
  30022689, // personal - productivity
  29858693, // personal - TeamGantt
  30329336, // software - tts
  30213629, // software - server hosting
  30264753, // software - ericheikes.com
  30265014, // software - mheikes.com
  30265018, // sofware - mixtapes
  30265024, // software - links.php
  30265028, // software - ttrss
  30265049, // software - wiki
  30265050, // software - the week
]

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

export const assignPerson = async (taskId: number, userId: number): Promise<Resource> => {
  const { id_token: idToken } = await getAuthTokens()
  const { teamgantt: { apiUrl } } = await getConfig()
  const url = `${apiUrl}/tasks/${taskId}/resources`
  try {
    log('assignPerson', `Assigning person to task ${url}`)
    const resource = await got.post(url, {
      headers: {
        Authorization: `Bearer ${idToken}`
      },
      json: {
        type: 'user',
        type_id: userId
      }
    }).json<Resource>()
    return resource
  } catch (err: any) {
    log('assignPerson', 'ERROR!')
    if (err.response) {
      log('assignPerson', err.response.statusCode, err.response.body)
    }
    if (err instanceof Error) {
      log('assignPerson', err)
    }
    throw err
  }
}

export const deleteTask = async (id: number): Promise<void> => {
  const { id_token: idToken } = await getAuthTokens()
  const { teamgantt: { apiUrl } } = await getConfig()
  const url = `${apiUrl}/tasks/${id}`
  try {
    log('deleteTask', `Deleting task ${url}`)
    await got.delete(url, {
      headers: {
        Authorization: `Bearer ${idToken}`
      }
    })
  } catch (err: any) {
    log('deleteTask', 'ERROR!', err)
    if (err.response) {
      log('deleteTask', err.response.statusCode, err.response.body)
    }
    if (err instanceof Error) {
      log('deleteTask', err)
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

export const getCurrentUser = async (): Promise<User> => {
  const { id_token: idToken } = await getAuthTokens()
  const { teamgantt: { apiUrl } } = await getConfig()
  const url = `${apiUrl}/current_user`
  try {
    log('getCurrentUser', `Getting logged-in user info ${url}`)
    const user = await got.get(url, {
      headers: {
        Authorization: `Bearer ${idToken}`
      }
    }).json<User>()
    return user
  } catch (err: any) {
    log('getCurrentUser', 'ERROR!', err)
    if (err.response) {
      log('getCurrentUser', err.response.statusCode, err.response.body)
    }
    if (err instanceof Error) {
      log('getCurrentUser', err)
    }
    throw err
  }
}

export const getProjects = async (): Promise<Project[]> => {
  const { id_token: idToken } = await getAuthTokens()
  const { teamgantt: { apiUrl } } = await getConfig()
  const url = `${apiUrl}/projects/all`
  try {
    log('getProjects', `Getting projects ${url}`)
    const projects = await got.get(url, {
      headers: {
        Authorization: `Bearer ${idToken}`
      }
    }).json<Project[]>()
    return projects
  } catch (err: any) {
    log('getProjects', 'ERROR!', err)
    if (err.response) {
      log('getProjects', err.response.statusCode, err.response.body)
    }
    if (err instanceof Error) {
      log('getProjects', err)
    }
    throw err
  }
}

export const getOldTasks = async (): Promise<Task[]> => {
  const oldDatetime = Date.now() - ONE_DAY * 30 * 6 // approx 6 months
  const { id_token: idToken } = await getAuthTokens()
  const { teamgantt: { apiUrl } } = await getConfig()
  const url = `${apiUrl}/tasks?hide_completed=false&include_overdue=true`
  try {
    log('getOldTasks', `Getting all tasks ${url}`)
    const tasks = await got.get(url, {
      headers: {
        Authorization: `Bearer ${idToken}`
      }
    }).json<Task[]>()
    return tasks.filter(task => {
      // Only include completed tasks
      if (task.percent_complete < 100) { return false }
      // Only include daily recurring tasks (for now)
      // if (task.parent_group_id !== dailyChoresGroup && task.parent_group_id !== personalDailiesGroup) { return false }
      // Exclude certain groups (TODO: Change this to parent categories probably)
      if (excludedGroups.includes(task.parent_group_id)) { return false }
      // Check if the task is old
      if (task.end_date && (Date.parse(task.end_date) < oldDatetime)) { return true }
      if (task.start_date && (Date.parse(task.start_date) < oldDatetime)) { return true }
      return false
    })
  } catch (err: any) {
    log('getOldTasks', 'ERROR!', err)
    if (err.response) {
      log('getOldTasks', err.response.statusCode, err.response.body)
    }
    if (err instanceof Error) {
      log('getOldTasks', err)
    }
    throw err
  }
}

export const getTodaysTasks = async (): Promise<Task[]> => {
  const { id_token: idToken } = await getAuthTokens()
  const { teamgantt: { apiUrl } } = await getConfig()
  const url = `${apiUrl}/tasks?status=inprogress&hide_completed=true&include_overdue=true&unscheduled=false`
  try {
    log('getTodaysTasks', `Getting in progress tasks ${url}`)
    const tasks = await got.get(url, {
      headers: {
        Authorization: `Bearer ${idToken}`
      }
    }).json<Task[]>()
    return tasks
  } catch (err: any) {
    log('getTodaysTasks', 'ERROR!', err)
    if (err.response) {
      log('getTodaysTasks', err.response.statusCode, err.response.body)
    }
    if (err instanceof Error) {
      log('getTodaysTasks', err)
    }
    throw err
  }
}

export const getUnassignedTasks = async (): Promise<Task[]> => {
  const { id_token: idToken } = await getAuthTokens()
  const { teamgantt: { apiUrl } } = await getConfig()
  const url = `${apiUrl}/tasks?hide_completed=true&unscheduled=false&unassigned=true`
  try {
    log('getUnassignedTasks', `Getting unassigned tasks ${url}`)
    const tasks = await got.get(url, {
      headers: {
        Authorization: `Bearer ${idToken}`
      }
    }).json<Task[]>()
    return tasks
  } catch (err: any) {
    log('getUnassignedTasks', 'ERROR!', err)
    if (err.response) {
      log('getUnassignedTasks', err.response.statusCode, err.response.body)
    }
    if (err instanceof Error) {
      log('getUnassignedTasks', err)
    }
    throw err
  }
}
