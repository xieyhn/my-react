import { createHostRootFiber } from './ReactFiber'
import { initialUpdateQueue } from './ReactFiberClassUpdateQueue'

export function FiberRootNode(containerInfo) {
  this.containerInfo = containerInfo
  /**
   * @type {import('./ReactFiber').FiberNode}
   */
  this.current = null

  /**
   * @type {import('./ReactFiber').FiberNode}
   */
  this.finishedWork = null
}

export function createFiberRoot(containerInfo) {
  const root = new FiberRootNode(containerInfo)
  const uninitializedFiber = createHostRootFiber()

  root.current = uninitializedFiber
  uninitializedFiber.stateNode = root

  initialUpdateQueue(uninitializedFiber)

  return root
}
