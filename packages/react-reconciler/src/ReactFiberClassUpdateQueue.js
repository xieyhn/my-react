import { enqueueConcurrentClassUpdate } from './ReactFiberConcurrentUpdates'
import assign from 'shared/assign'
import { isSubsetOfLanes, mergeLanes, NoLanes } from './ReactFiberLane'

export const UpdateState = 0

/**
 * @param {import('./ReactFiber').FiberNode} fiber
 */
export function initialUpdateQueue(fiber) {
  const queue = {
    shared: {
      // pending 是一个循环链表
      pending: null
    },
    baseState: fiber.memoizedState,
    firstBaseUpdate: null,
    lastBaseUpdate: null
  }
  fiber.updateQueue = queue
}

export function createUpdate(lane) {
  const update = {
    tag: UpdateState,
    lane,
    next: null
  }
  return update
}

/**
 * @param {import('./ReactFiber').FiberNode} fiber
 * @param {*} update
 * @param {number} lane
 */
export function enqueueUpdate(fiber, update, lane) {
  const updateQueue = fiber.updateQueue
  const sharedQueue = updateQueue.shared

  return enqueueConcurrentClassUpdate(fiber, sharedQueue, update, lane)
}

/**
 * @param {import('./ReactFiber').FiberNode} workInProgress
 */
export function processUpdateQueue(workInProgress, nextProps, renderLanes) {
  const queue = workInProgress.updateQueue
  let firstBaseUpdate = queue.firstBaseUpdate
  let lastBaseUpdate = queue.lastBaseUpdate
  const pendingQueue = queue.shared.pending

  if (pendingQueue) {
    queue.shared.pending = null
    const lastPendingUpdate = pendingQueue
    const firstPendingUpdate = lastPendingUpdate.next
    // 剪开循环链表
    lastPendingUpdate.next = null

    if (!lastBaseUpdate) {
      firstBaseUpdate = firstPendingUpdate
    } else {
      lastBaseUpdate.next = firstPendingUpdate
    }
    lastBaseUpdate = lastPendingUpdate
  }

  if (firstBaseUpdate) {
    let newState = queue.baseState
    let newLanes = NoLanes
    let newBaseState = null
    let newFirstBaseUpdate = null
    let newLastBaseUpdate = null
    let update = firstBaseUpdate

    do {
      const updateLane = update.lane
      if (!isSubsetOfLanes(renderLanes, updateLane)) {
        const clone = {
          id: update.id,
          lane: updateLane,
          payload: update.payload
        }
        if (!newLastBaseUpdate) {
          newFirstBaseUpdate = newLastBaseUpdate = clone
          newBaseState = newState
        } else {
          newLastBaseUpdate = newLastBaseUpdate.next = clone
        }
        newLanes = mergeLanes(newLanes, updateLane)
      } else {
        if (newLastBaseUpdate) {
          const clone = {
            id: update.id,
            lane: 0,
            payload: update.payload
          }
          newLastBaseUpdate = newLastBaseUpdate.next = clone
        }
        newState = getStateFromUpdate(update, newState, nextProps)
      }
      update = update.next;
    } while (update)

    if (!newLastBaseUpdate) {
      newBaseState = newState
    }
    queue.baseState = newBaseState
    queue.firstBaseUpdate = newFirstBaseUpdate
    queue.lastBaseUpdate = newLastBaseUpdate
    workInProgress.lanes = newLanes
    workInProgress.memoizedState = newState
  }
}

function getStateFromUpdate(update, prevState, nextProps) {
  switch (update.tag) {
    case UpdateState:
      const { payload } = update
      let partialState
      if (typeof payload === 'function') {
        partialState = payload.call(null, prevState, nextProps)
      } else {
        partialState = payload
      }
      return assign({}, prevState, partialState)
  }
}

/**
 * @param {import('./ReactFiber').FiberNode} current
 * @param {import('./ReactFiber').FiberNode} workInProgress
 */
export function cloneUpdateQueue(current, workInProgress) {
  const workInProgressQueue = workInProgress.updateQueue
  const currentQueue = current.updateQueue
  if (workInProgressQueue === currentQueue) {
    const clone = {
      baseState: currentQueue.baseState,
      firstBaseUpdate: currentQueue.firstBaseUpdate,
      lastBaseUpdate: currentQueue.lastBaseUpdate,
      shared: currentQueue.shared
    }
    workInProgress.updateQueue = clone
  }
}
