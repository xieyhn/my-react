import { HostRoot } from './ReactWorkTags'
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
  // 指向父节点
  this.return = null
  // 指向第一个子节点
  this.child = null
  // 指向下一个兄弟节点
  this.sibling = null
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
  // ?
  this.alternate = null
}

export function createFiber(tag, paddingProps, key) {
  return new FiberNode(tag, paddingProps, key)
}

export function createHostRootFiber() {
  return createFiber(HostRoot, null, null)
}