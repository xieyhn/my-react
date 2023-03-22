import { shouldSetTextContent } from 'react-dom-bindings/src/client/ReactDOMHostConfig'
import { mountChildFibers, reconcileChildFibers } from './ReactChildFiber'
import { cloneUpdateQueue, processUpdateQueue } from './ReactFiberClassUpdateQueue'
import { renderWithHooks } from './ReactFiberHooks'
import {
  FunctionComponent,
  HostComponent,
  HostRoot,
  HostText,
  IndeterminateComponent
} from './ReactWorkTags'

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
 * @param {number} renderLanes
 */
function updateHostRoot(current, workInProgress, renderLanes) {
  const nextProps = workInProgress.pendingProps
  cloneUpdateQueue(current, workInProgress)
  processUpdateQueue(workInProgress, nextProps, renderLanes)
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
 * @param {(...args: any[]) => import('./ReactFiber').FiberNode} Component
 */
function mountIndeterminateComponent(current, workInProgress, Component) {
  const props = workInProgress.pendingProps
  const children = renderWithHooks(current, workInProgress, Component, props)
  workInProgress.tag = FunctionComponent
  reconcileChildren(current, workInProgress, children)
  return workInProgress.child
}

/**
 * @param {import('./ReactFiber').FiberNode} current
 * @param {import('./ReactFiber').FiberNode} workInProgress
 * @param {(...args: any[]) => import('./ReactFiber').FiberNode} Component
 */
function updateFunctionComponent(current, workInProgress, Component, nextProps, renderLanes) {
  const nextChildren = renderWithHooks(current, workInProgress, Component, nextProps, renderLanes)
  reconcileChildren(current, workInProgress, nextChildren)
  return workInProgress.child
}

/**
 * @param {import('./ReactFiber').FiberNode} current
 * @param {import('./ReactFiber').FiberNode} workInProgress
 * @param {number} renderLanes
 */
export function beginWork(current, workInProgress, renderLanes) {
  workInProgress.lanes = 0
  switch (workInProgress.tag) {
    case HostRoot:
      return updateHostRoot(current, workInProgress, renderLanes)
    case HostComponent:
      return updateHostComponent(current, workInProgress, renderLanes)
    case HostText:
      return null
    case IndeterminateComponent:
      return mountIndeterminateComponent(current, workInProgress, workInProgress.type, renderLanes)
    case FunctionComponent:
      const Component = workInProgress.type
      const nextProps = workInProgress.pendingProps
      return updateFunctionComponent(current, workInProgress, Component, nextProps, renderLanes)
    default:
      return null
  }
}
