import { push, peek, pop } from "../SchedulerMinHeap"
import { IdlePriority, ImmediatePriority, LowPriority, NormalPriority, UserBlockingPriority } from "../SchedulerPriorities"

// Max 31 bit integer. The max integer size in V8 for 32-bit systems.
// Math.pow(2, 30) - 1
// 0b111111111111111111111111111111
const maxSigned31BitInt = 1073741823

// 即刻的优先级，单位毫秒
const IMMEDIATE_PRIORITY_TIMEOUT = -1
// 用户阻塞操作的优先级
const USER_BLOCKING_PRIORITY_TIMEOUT = 250
// 正常优先级的超时时间
const NORMAL_PRIORITY_TIMEOUT = 5000
// 低优先级超时时间
const LOW_PRIORITY_TIMEOUT = 10000
// 没有超时时间限制
const IDLE_PRIORITY_TIMEOUT = maxSigned31BitInt

// 5ms
const frameInterval = 5

const channel = new MessageChannel()
const port2 = channel.port2
const port1 = channel.port1
port1.onmessage = preformWorkUntilDeadline

let taskIdCounter = 1
// 任务最小堆
let taskQueue = []
let scheduleHostCallback = null
// 记录申请的每个时间片开始工作的时间
let startTime = null
let currentTask = null

function getCurrentTime() {
  return performance.now()
}

function shouldYieldToHost() {
  const timeElapsed = getCurrentTime() - startTime
  if (timeElapsed < frameInterval) {
    // 可以继续执行
    return false
  }
  return true
}

export {
  shouldYieldToHost as shouldYield
}

function workLoop(startTime) {
  let currentTime = startTime
  // 拿到优先级最高的任务（离过期时间最近的）
  currentTask = peek(taskQueue)

  while(currentTask) {
    if (currentTask.expirationTime > currentTime && shouldYieldToHost()) {
      // 未过期，但需要放弃（申请的时间片到期了）
      // 如果过期了，应该继续强制执行
      break
    }
    const callback = currentTask.callback
    if (typeof callback === 'function') {
      currentTask.callback = null
      const didUserCallbackTimeout = currentTask.expirationTime <= currentTime
      const continuationCallback = callback(didUserCallbackTimeout)
      if (typeof continuationCallback === 'function') {
        currentTask.callback = continuationCallback
        // 表示还有任务要执行，hasMoreWork
        return true
      }
      if (currentTask === peek(taskQueue)) {
        // 任务已经执行
        pop(taskQueue)
      }
    } else {
      // 不是函数没有什么意义，丢弃
      pop(taskQueue)
    }
    currentTask = peek(taskQueue)
  }

  return !!currentTask
}

function flushWork(startTime) {
  return workLoop(startTime)
}

/**
 * 按优先级执行任务
 * @param {*} priorityLevel
 * @param {*} callback
 */
export function schedulerCallback(priorityLevel, callback) {
  const currentTime = getCurrentTime()
  const startTime = currentTime
  let timeout

  switch (priorityLevel) {
    case ImmediatePriority:
      timeout = IMMEDIATE_PRIORITY_TIMEOUT
      break
    case UserBlockingPriority:
      timeout = USER_BLOCKING_PRIORITY_TIMEOUT
      break
    case IdlePriority:
      timeout = IDLE_PRIORITY_TIMEOUT
      break
    case LowPriority:
      timeout = LOW_PRIORITY_TIMEOUT
      break
    case NormalPriority:
    default:
      timeout = NORMAL_PRIORITY_TIMEOUT
      break
  }

  // 此任务的过期时间
  const expirationTime = startTime + timeout
  const newTask = {
    id: taskIdCounter++,
    callback,
    // 优先级级别
    priorityLevel,
    startTime,
    expirationTime,
    // 排序依据
    sortIndex: expirationTime
  }
  // 向任务最小堆中添加任务，根据过期时间来排序
  push(taskQueue, newTask)
  requestHostCallback(flushWork)
  return newTask
}

function requestHostCallback(flushWork) {
  scheduleHostCallback = flushWork
  // 执行工作直到截止时间
  schedulePreformWorkUntilDeadline()
}

function schedulePreformWorkUntilDeadline() {
  port2.postMessage(null)
}

function preformWorkUntilDeadline() {
  if (scheduleHostCallback) {
    startTime = getCurrentTime()
    let hasMoreWork = true
    
    try {
      hasMoreWork = scheduleHostCallback(startTime)
    } finally {
      if (hasMoreWork) {
        // 执行完成后，还有工作需要处理
        schedulePreformWorkUntilDeadline()
      } else {
        scheduleHostCallback = null
      }
    }
  }
}
