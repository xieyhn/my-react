import { schedulerCallback } from 'scheduler/index'
import { createWorkInProgress } from './ReactFiber'
import { beginWork } from './ReactFiberBeginWork'

/** @type {import('./ReactFiber').FiberNode} */
let workInProgress = null

/**
 * @param {import('./ReactFiberRoot').FiberRootNode} root 
 */
export function scheduleUpdateOnFiber(root) {
  ensureRootIsScheduled(root)
}

/**
 * @param {import('./ReactFiberRoot').FiberRootNode} root 
 */
function ensureRootIsScheduled(root) {
  schedulerCallback(performConcurrentWorkOnRoot.bind(null, root))
}

/**
 * @param {import('./ReactFiberRoot').FiberRootNode} root 
 */
function performConcurrentWorkOnRoot(root) {
  // 第一次渲染以同步方式，为了尽快展示页面
  renderRootSync(root)
}

/**
 * @param {import('./ReactFiberRoot').FiberRootNode} root 
 */
function prepareFreshStack(root) {
  workInProgress = createWorkInProgress(root.current, null)
}

/**
 * @param {import('./ReactFiberRoot').FiberRootNode} root 
 */
function renderRootSync(root) {
  prepareFreshStack(root)
  workLoopSync()
}

function workLoopSync() {
  while(workInProgress !== null) {
    performUnitOfWork(workInProgress)
  }
}

/**
 * @param {import('./ReactFiber').FiberNode} unitOfWork 
 */
function performUnitOfWork(unitOfWork) {
  const current = unitOfWork.alternate
  const next = beginWork(current, unitOfWork)
  unitOfWork.memoizedProps = unitOfWork.paddingProps
  if (next === null) {
    // completeUnitWork(unitOfWork)
    workInProgress = null
  } else {
    workInProgress = next
  }
}