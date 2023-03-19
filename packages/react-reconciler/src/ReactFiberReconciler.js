import { createFiberRoot } from './ReactFiberRoot'
import { createUpdate, enqueueUpdate } from './ReactFiberClassUpdateQueue'
import { requestUpdateLane, scheduleUpdateOnFiber } from './ReactFiberWorkLoop'

/*
 * @param {HTMLElement} container
 */
export function createContainer(containerInfo) {
  return createFiberRoot(containerInfo)
}

/**
 * 将虚拟 DOM 生成为真实 DOM
 * @param {*} element
 * @param {import('./ReactFiberRoot').FiberRootNode} container ?
 */
export function updateContainer(element, container) {
  // root fiber (FiberNode)
  const current = container.current
  const lane = requestUpdateLane(current)
  const update = createUpdate(lane)
  update.payload = { element }
  const root = enqueueUpdate(current, update, lane)
  scheduleUpdateOnFiber(root, current, lane)
}
