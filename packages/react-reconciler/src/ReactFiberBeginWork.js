import { shouldSetTextContent } from 'react-dom-bindings/src/client/ReactDOMHostConfig'
import { mountChildFibers, reconcileChildFibers } from './ReactChildFiber'
import { processUpdateQueue } from './ReactFiberClassUpdateQueue'
import { HostComponent, HostRoot, HostText } from './ReactWorkTags'

/**
 *
 * @param {import('./ReactFiber').FiberNode} current
 * @param {import('./ReactFiber').FiberNode} workInProgress
 * @param {*} nextChildren 新的子节点（虚拟DOM)
 */
function reconcileChildren(current, workInProgress, nextChildren) {
  if (!current) {
    workInProgress.child = mountChildFibers(workInProgress, null, nextChildren)
  } else {
    workInProgress.child = reconcileChildFibers(workInProgress, current.child, nextChildren)
  }
}

/**
 * @param {import('./ReactFiber').FiberNode} current
 * @param {import('./ReactFiber').FiberNode} workInProgress
 */
function updateHostRoot(current, workInProgress) {
  processUpdateQueue(workInProgress)
  const nextState = workInProgress.memoizedState
  const nextChildren = nextState.element
  reconcileChildren(current, workInProgress, nextChildren)
  return workInProgress.child
}

/**
 * Handle 原生组件
 * @param {import('./ReactFiber').FiberNode} current
 * @param {import('./ReactFiber').FiberNode} workInProgress
 */
function updateHostComponent(current, workInProgress) {
  const { type } = workInProgress
  const nextProps = workInProgress.pendingProps
  let nextChildren = nextProps.children

  // 当仅有一个文本子节点时，做优化，不创建这个子节点
  const isDirectTextChild = shouldSetTextContent(type, nextProps)
  if (isDirectTextChild) {
    nextChildren = null
  }
  reconcileChildren(current, workInProgress, nextChildren)
  return workInProgress.child
}

/**
 * @param {import('./ReactFiber').FiberNode} current
 * @param {import('./ReactFiber').FiberNode} workInProgress
 */
export function beginWork(current, workInProgress) {
  switch (workInProgress.tag) {
    case HostRoot:
      return updateHostRoot(current, workInProgress)
    case HostComponent:
      return updateHostComponent(current, workInProgress)
    case HostText:
      return null
    default:
      return null
  }
}
