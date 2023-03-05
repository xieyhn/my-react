import { markUpdateLaneFromFiberToRoot } from './ReactFiberConcurrentUpdates'
import assign from 'shared/assign'

export const UpdateState = 0

export function initialUpdateQueue(fiber) {
  const queue = {
    shared: {
      // pending 是一个循环链表
      pending: null
    }
  }
  fiber.updateQueue = queue
}

export function createUpdate() {
  const update = {
    tag: UpdateState
  }
  return update
}

/**
 * @param {import('./ReactFiber').FiberNode} fiber
 * @param {*} update
 */
export function enqueueUpdate(fiber, update) {
  const updateQueue = fiber.updateQueue
  const pending = updateQueue.pending

  // 构建单向循环链表
  if (!pending) {
    update.next = update
  } else {
    update.next = pending.next
    pending.next = update
  }

  updateQueue.shared.pending = update

  return markUpdateLaneFromFiberToRoot(fiber)
}

/**
 *
 * @param {import('./ReactFiber').FiberNode} workInProgress
 */
export function processUpdateQueue(workInProgress) {
  const queue = workInProgress.updateQueue
  const pendingQueue = queue.shared.pending
  if (pendingQueue) {
    queue.shared.pending = null
    // queue.shared.pending 始终都是指向最后一个
    const lastPendingUpdate = pendingQueue
    // 因是循环链表，最后一个 next 指向第一个
    const firstPendingUpdate = pendingQueue.next
    // 循环列表剪开，变为单向链表
    lastPendingUpdate.next = null

    let newState = workInProgress.memoizedState
    let update = firstPendingUpdate

    while (update) {
      newState = getStateFromUpdate(update, newState)
      update = update.next
    }

    workInProgress.memoizedState = newState
  }
}

function getStateFromUpdate(update, prevState) {
  switch (update.tag) {
    case UpdateState:
      const { payload } = update
      return assign({}, prevState, payload)
  }
}
