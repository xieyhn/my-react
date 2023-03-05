import { schedulerCallback } from 'scheduler/index'
import { createWorkInProgress } from './ReactFiber'
import { beginWork } from './ReactFiberBeginWork'
import { completeWork } from './ReactFiberCompleteWork'

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
  console.log(root.current.alternate)
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
  while (workInProgress) {
    performUnitOfWork(workInProgress)
  }
}

/**
 * @param {import('./ReactFiber').FiberNode} unitOfWork
 */
function performUnitOfWork(unitOfWork) {
  const current = unitOfWork.alternate
  // 返回子节点
  const next = beginWork(current, unitOfWork)
  unitOfWork.memoizedProps = unitOfWork.pendingProps
  if (!next) {
    completeUnitWork(unitOfWork)
  } else {
    workInProgress = next
  }
}

/**
 * @param {import('./ReactFiber').FiberNode} unitOfWork
 */
function completeUnitWork(unitOfWork) {
  let completedWork = unitOfWork
  do {
    const current = completedWork.alternate
    const returnFiber = completedWork.return
    completeWork(current, completedWork)
    const siblingFiber = completedWork.sibling
    if (siblingFiber) {
      workInProgress = siblingFiber
      return
    }
    // 完成了所有的子 Fiber，接着完成父 Fiber
    completedWork = returnFiber
    workInProgress = completedWork
  } while (completedWork)
}
