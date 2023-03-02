import { HostComponent, HostRoot, IndeterminateComponent } from './ReactWorkTags'
import { NoFlags } from './ReactFiberFlags'

/**
 * @param {*} tag
 * @param {*} paddingProps
 * @param {*} key 
 */
export function FiberNode(tag, paddingProps, key) {
  this.tag = tag
  this.key = key
  this.type = null
  // 指向真实 DOM？
  this.stateNode = null

  /**
   * 父节点
   * @type {FiberNode}
   */
  this.return = null
  /**
   * 指向第一个子节点
   * @type {FiberNode}
   */
  this.child = null
  /**
   * 指向下一个兄弟节点
   * @type {FiberNode}
   */
  this.sibling = null
  this.index = 0

  // 等待生效的 props
  this.paddingProps = paddingProps
  // 已经生效的 props
  this.memoizedProps = null
  // ?
  this.memoizedState = null
  // ?
  this.updateQueue = null
  // ?
  this.flags = NoFlags
  // ?
  this.subtreeFlags = NoFlags
  /**
   * @type {FiberNode}
   */
  this.alternate = null
}

export function createFiber(tag, paddingProps, key) {
  return new FiberNode(tag, paddingProps, key)
}

export function createHostRootFiber() {
  return createFiber(HostRoot, null, null)
}

/**
 * 基于老 Fiber 和新属性来创建新的 Fiber
 * @param {FiberNode} current 
 * @param {*} pendingProps 
 */
export function createWorkInProgress(current, pendingProps) {
  let workInProgress = current.alternate

  if (!workInProgress) {
    workInProgress = createFiber(current.tag, pendingProps, current.key)
    workInProgress.type = current.type
    workInProgress.stateNode = current.stateNode
    workInProgress.alternate = current
    current.alternate = workInProgress
  } else {
    workInProgress.pendingProps = pendingProps
    workInProgress.type = current.type
    workInProgress.flags = NoFlags
    workInProgress.subtreeFlags = NoFlags
  }
  workInProgress.child = current.child
  workInProgress.memoizedProps = current.memoizedProps
  workInProgress.memoizedState = current.memoizedState
  workInProgress.updateQueue = current.updateQueue
  workInProgress.sibling = current.sibling
  workInProgress.index = current.index

  return workInProgress
}

export function createFiberFromElement(element) {
  const { type, key, props } = element
  return createFiberFromTypeAndProps(type, key, props)
}

function createFiberFromTypeAndProps(type, key, pendingProps) {
  let tag = IndeterminateComponent

  // 原生 DOM 节点
  if (typeof type === 'string') {
    tag = HostComponent
  }

  const fiber = createFiber(tag, pendingProps, key)
  fiber.type = type
  return fiber
}