import { getCurrentEventPriority } from 'react-dom-bindings/src/client/ReactDOMHostConfig'
import {
  ContinuousEventPriority,
  DefaultEventPriority,
  DiscreteEventPriority,
  getCurrentUpdatePriority,
  IdleEventPriority,
  lanesToEventPriority,
  setCurrentUpdatePriority
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
  includesBlockingLane,
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
import { flushSyncCallbacks, scheduleSyncCallback } from './ReactFiberSyncTaskQueue'

/** @type {import('./ReactFiber').FiberNode} */
let workInProgress = null
/** @type {import('./ReactFiberRoot').FiberRootNode} */
let workInProgressRoot = null
/**
 * 记录根节点 fiber 有没有类似 useEffect 的副作用
 */
let rootDoesHavePassiveEffect = false
let rootWithPendingPassiveEffects = null
let workInProgressRootRenderLanes = NoLanes

const RootInProgress = 0
const RootCompleted = 5
let workInProgressRootExitStatus = RootInProgress

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
function performSyncWorkOnRoot(root) {
  const lanes = getNextLanes(root)
  renderRootSync(root, lanes)
  const finishedWork = root.current.alternate
  root.finishedWork = finishedWork
  commitRoot(root)
  return null
}

/**
 * @param {import('./ReactFiberRoot').FiberRootNode} root
 */
function ensureRootIsScheduled(root) {
  const nextLanes = getNextLanes(root)
  if (nextLanes === NoLanes) {
    return
  }
  let newCallbackPriority = getHighestPriorityLane(nextLanes)
  let newCallbackNode

  if (newCallbackPriority === SyncLane) {
    scheduleSyncCallback(performSyncWorkOnRoot.bind(null, root))
    window.queueMicrotask(flushSyncCallbacks)
    newCallbackNode = null
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
    newCallbackNode = schedulerCallback(
      schedulerPriorityLevel,
      performConcurrentWorkOnRoot.bind(null, root)
    )
  }
  root.callbackNode = newCallbackNode
}

/**
 * @param {import('./ReactFiberRoot').FiberRootNode} root
 * @param {*} didTimeout
 */
function performConcurrentWorkOnRoot(root, didTimeout) {
  const originalCallbackNode = root.callbackNode

  const lanes = getNextLanes(root, NoLanes)
  if (lanes === NoLanes) {
    return null
  }
  const shouldTimeSlice = !includesBlockingLane(root, lanes) && !didTimeout
  const exitStatus = shouldTimeSlice
    ? renderRootConcurrent(root, lanes)
    : renderRootSync(root, lanes)
  
  if (exitStatus !== RootInProgress) {
    const finishedWork = root.current.alternate
    root.finishedWork = finishedWork
    commitRoot(root)
  }

  if (root.callbackNode === originalCallbackNode) {
    return performConcurrentWorkOnRoot.bind(null, root)
  }
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
  const previousUpdatePriority = getCurrentUpdatePriority()
  try {
    setCurrentUpdatePriority(DiscreteEventPriority)
    commitRootImpl(root)
  } finally {
    setCurrentUpdatePriority(previousUpdatePriority)
  }
}

/**
 * @param {import('./ReactFiberRoot').FiberRootNode} root
 */
function commitRootImpl(root) {
  const { finishedWork } = root
  workInProgressRoot = null
  workInProgressRootRenderLanes = null
  root.callbackNode = null

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
  workInProgress = createWorkInProgress(root.current, null)
  workInProgressRootRenderLanes = renderLanes
  finishQueueingConcurrentUpdates()
}

/**
 * @param {import('./ReactFiberRoot').FiberRootNode} root
 * @param {number} renderLanes
 */
function renderRootConcurrent(root, renderLanes) {
  if (workInProgressRoot !== root || workInProgressRootRenderLanes !== renderLanes) {
    prepareFreshStack(root, renderLanes)
  }
  workLoopConcurrent()
  if (workInProgress) {
    return RootInProgress
  }
  return workInProgressRootExitStatus
}

/**
 * @param {import('./ReactFiberRoot').FiberRootNode} root
 * @param {number} renderLanes
 */
function renderRootSync(root, renderLanes) {
  if (root !== workInProgressRoot || workInProgressRootRenderLanes !== renderLanes) {
    prepareFreshStack(root, renderLanes)
  }
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
  const next = beginWork(current, unitOfWork, workInProgressRootRenderLanes)
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
  if (workInProgressRootExitStatus === RootInProgress) {
    workInProgressRootExitStatus = RootCompleted
  }
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
