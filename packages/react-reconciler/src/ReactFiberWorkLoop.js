import { schedulerCallback } from 'scheduler/index'
import { createWorkInProgress } from './ReactFiber'
import { beginWork } from './ReactFiberBeginWork'
import { completeWork } from './ReactFiberCompleteWork'
import { MutationMask, NoFlags } from './ReactFiberFlags'

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
  // commit
  const finishedWork = root.current.alternate
  root.finishedWork = finishedWork
  commitRoot(root)
}

/**
 * @param {import('./ReactFiberRoot').FiberRootNode} root
 */
function commitRoot(root) {
  const { finishedWork } = root
  const rootHasEffect = finishedWork.flags & MutationMask
  const subtreeHasEffects = finishedWork.subtreeFlags & MutationMask

  if (rootHasEffect || subtreeHasEffects) {
    debugger
  }

  root.current = finishedWork
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
  // 返回第一个子节点
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
    const siblingFiber = completedWork.sibling
    completeWork(current, completedWork)

    // 完成此 fiber 之后，如果有兄弟节点，去兄弟节点开始 beginWork
    if (siblingFiber) {
      workInProgress = siblingFiber
      return
    }

    // 没有了兄弟 fiber，返回处理父节点
    completedWork = returnFiber
    workInProgress = returnFiber
  } while (completedWork)
}
