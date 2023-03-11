import { schedulerCallback } from 'scheduler/index'
import { createWorkInProgress } from './ReactFiber'
import { beginWork } from './ReactFiberBeginWork'
import { commitMutationEffectsOnFiber, commitPassiveMountEffect, commitPassiveUnmountEffect } from './ReactFiberCommitWork'
import { completeWork } from './ReactFiberCompleteWork'
import { finishQueueingConcurrentUpdates } from './ReactFiberConcurrentUpdates'
import { ChildDeletion, MutationMask, NoFlags, Passive, Placement, Update } from './ReactFiberFlags'
import { FunctionComponent, HostComponent, HostRoot, HostText } from './ReactWorkTags'

/** @type {import('./ReactFiber').FiberNode} */
let workInProgress = null
/** @type {import('./ReactFiberRoot').FiberRootNode} */
let workInProgressRoot = null
/**
 * 记录根节点 fiber 有没有类似 useEffect 的副作用
 */
let rootDoesHavePassiveEffect = false
let rootWithPendingPassiveEffects = null

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
  if (workInProgressRoot) return
  workInProgressRoot = root
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
  printFinishedWork(finishedWork)
  root.finishedWork = finishedWork
  commitRoot(root)
  workInProgressRoot = null
}

function flushPassiveEffect() {
  if (rootWithPendingPassiveEffects) {
    const root = rootWithPendingPassiveEffects
    commitPassiveUnmountEffect(root.current)
    commitPassiveMountEffect(root, root.current)
  }
}

/**
 * @param {import('./ReactFiberRoot').FiberRootNode} root
 */
function commitRoot(root) {
  const { finishedWork } = root
  if (finishedWork.subtreeFlags & Passive || finishedWork.flags & Passive) {
    if (!rootDoesHavePassiveEffect) {
      rootDoesHavePassiveEffect = true
      schedulerCallback(flushPassiveEffect)
    }
  }

  const rootHasEffect = finishedWork.flags & MutationMask
  const subtreeHasEffects = finishedWork.subtreeFlags & MutationMask

  if (rootHasEffect || subtreeHasEffects) {
    commitMutationEffectsOnFiber(finishedWork, root)
    if (rootDoesHavePassiveEffect) {
      rootDoesHavePassiveEffect = false
      rootWithPendingPassiveEffects = root
    }
  }
  root.current = finishedWork
}

/**
 * @param {import('./ReactFiberRoot').FiberRootNode} root
 */
function prepareFreshStack(root) {
  workInProgress = createWorkInProgress(root.current, null)
  finishQueueingConcurrentUpdates()
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

/**
 *
 * @param {import('./ReactFiber').FiberNode} fiber
 */
function printFinishedWork(fiber) {
  let child = fiber.child
  while (child) {
    printFinishedWork(child)
    child = child.sibling
  }
  if (fiber.flags !== 0) {
    console.log(getFlags(fiber.flags), getTag(fiber.tag), getType(fiber.type), fiber.memoizedProps)
  }
}

function getFlags(flags) {
  let str = '_'

  if (flags & Placement) {
    str += '插入_'
  }

  if (flags & Update) {
    str += '更新_'
  }

  if (flags & ChildDeletion) {
    str += '子节点有删除_'
  }

  return str
}

function getTag(tag) {
  switch (tag) {
    case HostRoot:
      return 'HostRoot'
    case HostComponent:
      return 'HostComponent'
    case HostText:
      return 'HostText'
    case FunctionComponent:
      return 'FunctionComponent'
    default:
      return tag
  }
}

function getType(type) {
  return typeof type === 'function' ? type.name : type
}
