import { getCurrentEventPriority } from 'react-dom-bindings/src/client/ReactDOMHostConfig'
import {
  ContinuousEventPriority,
  DefaultEventPriority,
  DiscreteEventPriority,
  getCurrentUpdatePriority,
  IdleEventPriority,
  lanesToEventPriority
} from './ReactEventProperties'
import { createWorkInProgress } from './ReactFiber'
import { beginWork } from './ReactFiberBeginWork'
import {
  commitLayoutEffects,
  commitMutationEffectsOnFiber,
  commitPassiveMountEffect,
  commitPassiveUnmountEffect
} from './ReactFiberCommitWork'
import { completeWork } from './ReactFiberCompleteWork'
import { finishQueueingConcurrentUpdates } from './ReactFiberConcurrentUpdates'
import { ChildDeletion, MutationMask, Passive, Placement, Update } from './ReactFiberFlags'
import {
  getHighestPriorityLane,
  getNextLanes,
  markRootUpdated,
  NoLanes,
  SyncLane
} from './ReactFiberLane'
import { FunctionComponent, HostComponent, HostRoot, HostText } from './ReactWorkTags'
import {
  ImmediatePriority as ImmediateSchedulerPriority,
  UserBlockingPriority as UserBlockingSchedulerPriority,
  IdlePriority as IdleSchedulerPriority,
  NormalPriority as NormalSchedulerPriority,
  shouldYield,
  schedulerCallback
} from 'scheduler/index'

/** @type {import('./ReactFiber').FiberNode} */
let workInProgress = null
/** @type {import('./ReactFiberRoot').FiberRootNode} */
let workInProgressRoot = null
/**
 * 记录根节点 fiber 有没有类似 useEffect 的副作用
 */
let rootDoesHavePassiveEffect = false
let rootWithPendingPassiveEffects = null
let workInProgressRenderLanes = NoLanes

/**
 * @param {import('./ReactFiberRoot').FiberRootNode} root
 */
export function scheduleUpdateOnFiber(root, fiber, lane) {
  markRootUpdated(root, lane)
  ensureRootIsScheduled(root)
}

/**
 * @param {import('./ReactFiberRoot').FiberRootNode} root
 */
function ensureRootIsScheduled(root) {
  const nextLanes = getNextLanes(root)
  let newCallbackPriority = getHighestPriorityLane(nextLanes)
  if (newCallbackPriority === SyncLane) {
    // TODO
  } else {
    let schedulerPriorityLevel

    switch (lanesToEventPriority(nextLanes)) {
      case DiscreteEventPriority:
        schedulerPriorityLevel = ImmediateSchedulerPriority
        break
      case ContinuousEventPriority:
        schedulerPriorityLevel = UserBlockingSchedulerPriority
        break
      case DefaultEventPriority:
        schedulerPriorityLevel = NormalSchedulerPriority
        break
      case IdleEventPriority:
        schedulerPriorityLevel = IdleSchedulerPriority
        break
      default:
        schedulerPriorityLevel = NormalSchedulerPriority
        break
    }
    schedulerCallback(schedulerPriorityLevel, performConcurrentWorkOnRoot.bind(null, root))
  }
  // if (workInProgressRoot) return
  // workInProgressRoot = root
}

/**
 * @param {import('./ReactFiberRoot').FiberRootNode} root
 */
function performConcurrentWorkOnRoot(root, timeout) {
  const nextLanes = getNextLanes(root, NoLanes)
  if (nextLanes === NoLanes) {
    return null
  }
  // 第一次渲染以同步方式，为了尽快展示页面
  renderRootSync(root, nextLanes)
  // commit
  const finishedWork = root.current.alternate
  printFinishedWork(finishedWork)
  root.finishedWork = finishedWork
  commitRoot(root)
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
  workInProgressRoot = null
  workInProgressRenderLanes = null

  if (finishedWork.subtreeFlags & Passive || finishedWork.flags & Passive) {
    if (!rootDoesHavePassiveEffect) {
      rootDoesHavePassiveEffect = true
      schedulerCallback(NormalSchedulerPriority, flushPassiveEffect)
    }
  }

  const rootHasEffect = finishedWork.flags & MutationMask
  const subtreeHasEffects = finishedWork.subtreeFlags & MutationMask

  if (rootHasEffect || subtreeHasEffects) {
    commitMutationEffectsOnFiber(finishedWork, root)
    commitLayoutEffects(finishedWork, root)
    if (rootDoesHavePassiveEffect) {
      rootDoesHavePassiveEffect = false
      rootWithPendingPassiveEffects = root
    }
  }
  root.current = finishedWork
}

/**
 * @param {import('./ReactFiberRoot').FiberRootNode} root
 * @param {number} renderLanes
 */
function prepareFreshStack(root, renderLanes) {
  if (root !== workInProgressRoot || workInProgressRenderLanes !== renderLanes) {
    workInProgress = createWorkInProgress(root.current, null)
  }
  workInProgressRenderLanes = renderLanes
  finishQueueingConcurrentUpdates()
}

/**
 * @param {import('./ReactFiberRoot').FiberRootNode} root
 * @param {number} nextLanes
 */
function renderRootSync(root, nextLanes) {
  prepareFreshStack(root, nextLanes)
  workLoopSync()
}

function workLoopSync() {
  while (workInProgress) {
    performUnitOfWork(workInProgress)
  }
}

function workLoopConcurrent() {
  while (workInProgress && !shouldYield()) {
    performUnitOfWork(workInProgress)
  }
}

/**
 * @param {import('./ReactFiber').FiberNode} unitOfWork
 */
function performUnitOfWork(unitOfWork) {
  const current = unitOfWork.alternate
  // 返回第一个子节点
  const next = beginWork(current, unitOfWork, workInProgressRenderLanes)
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

export function requestUpdateLane() {
  const updateLane = getCurrentUpdatePriority()
  if (updateLane !== NoLanes) {
    return updateLane
  }
  const eventLane = getCurrentEventPriority()
  return eventLane
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
