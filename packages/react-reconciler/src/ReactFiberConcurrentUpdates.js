import { HostRoot } from './ReactWorkTags'

const concurrentQueues = []
let concurrentQueuesIndex = 0

/**
 * @param {import('./ReactFiber').FiberNode} sourceFiber
 */
export function markUpdateLaneFromFiberToRoot(sourceFiber) {
  let node = sourceFiber
  let parent = node.return

  while (parent) {
    node = parent
    parent = node.return
  }

  if (node.tag === HostRoot) {
    return node.stateNode
  }

  return null
}

/**
 * @param {import('./ReactFiber').FiberNode} fiber
 * @param {*} queue Hook queue
 */
export function enqueueConcurrentHookUpdate(fiber, queue, update) {
  enqueueUpdate(fiber, queue, update)
  return getRootForUpdatedFiber(fiber)
}

/**
 * @param {import('./ReactFiber').FiberNode} fiber
 * @param {*} queue Hook queue
 */
function enqueueUpdate(fiber, queue, update) {
  concurrentQueues[concurrentQueuesIndex++] = fiber
  concurrentQueues[concurrentQueuesIndex++] = queue
  concurrentQueues[concurrentQueuesIndex++] = update
}

/**
 * @param {import('./ReactFiber').FiberNode} sourceFiber
 */
function getRootForUpdatedFiber(sourceFiber) {
  let node = sourceFiber
  let parent = node.return

  while(parent) {
    node = parent
    parent = parent.return
  }

  return node.tag === HostRoot ? node.stateNode : null 
}

export function finishQueueingConcurrentUpdates() {
  const endIndex = concurrentQueuesIndex
  concurrentQueuesIndex = 0
  let i = 0
  while(i < endIndex) {
    const fiber = concurrentQueues[i++]
    const queue = concurrentQueues[i++]
    const update = concurrentQueues[i++]

    if (queue && update) {
      // 构建循环链表
      const pending = queue.pending
      if (!pending) {
        update.next = update
      } else {
        update.next = pending.next
        pending.next = update
      }
      queue.pending = update
    }
  }
}
