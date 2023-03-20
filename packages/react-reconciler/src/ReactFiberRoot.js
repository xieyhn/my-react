import { createHostRootFiber } from './ReactFiber'
import { initialUpdateQueue } from './ReactFiberClassUpdateQueue'
import { NoLane, NoLanes } from './ReactFiberLane'

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

  /**
   * 表示此根上有哪些赛道等待被处理
   */
  this.pendingLanes = NoLanes
  
  /**
   * ?
   */
  this.callbackNode = null

  /**
   * ?
   */
  this.callbackPriority = NoLane
}

export function createFiberRoot(containerInfo) {
  const root = new FiberRootNode(containerInfo)
  const uninitializedFiber = createHostRootFiber()

  root.current = uninitializedFiber
  uninitializedFiber.stateNode = root

  initialUpdateQueue(uninitializedFiber)

  return root
}
