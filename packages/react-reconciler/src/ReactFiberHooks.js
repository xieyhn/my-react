import ReactSharedInternals from 'shared/ReactSharedInternals'
import { enqueueConcurrentHookUpdate } from './ReactFiberConcurrentUpdates'
import { scheduleUpdateOnFiber } from './ReactFiberWorkLoop'

const { ReactCurrentDispatcher } = ReactSharedInternals
/**
 * 记录当前正在操作的 fiber
 * @type {import('./ReactFiber').FiberNode}
 */
let currentlyRenderingFiber = null
// 正在操作的 hook
let workInProgressHook = null
// 老的 hook
let currentHook = null

const HooksDispatcherOnMount = {
  useReducer: mountReducer
}

const HooksDispatcherOnUpdate = {
  useReducer: updateReducer
}

function mountReducer(reducer, initialArg) {
  const hook = mountWorkInProgressHook()
  hook.memoizedState = initialArg
  const queue = {
    pending: null,
    dispatch: null
  }
  const dispatch = dispatchReducerAction.bind(null, currentlyRenderingFiber, queue)
  hook.queue = queue
  queue.dispatch = dispatch
  return [hook.memoizedState, dispatch]
}

function updateReducer(reducer) {
  const hook = updateWorkInProgressHook()
  const queue = hook.queue
  const pendingQueue = queue.pending
  let newState = currentHook.memoizedState

  if (pendingQueue) {
    queue.pending = null
    const firstUpdate = pendingQueue.next
    let update = firstUpdate
    do {
      const action = update.action
      newState = reducer(newState, action)
      update = update.next
    } while (update && update !== firstUpdate)
  }

  hook.memoizedState = newState
  return [newState, queue.dispatch]
}

/**
 * 更新状态，让界面重新更新
 * @param {import('./ReactFiber').FiberNode} fiber
 * @param {*} queue
 * @param {*} action
 */
function dispatchReducerAction(fiber, queue, action) {
  const update = {
    action,
    next: null
  }
  const root = enqueueConcurrentHookUpdate(fiber, queue, update)
  scheduleUpdateOnFiber(root)
}

function mountWorkInProgressHook() {
  const hook = {
    memoizedState: null,
    queue: null,
    next: null
  }
  if (!workInProgressHook) {
    currentlyRenderingFiber.memoizedState = workInProgressHook = hook
  } else {
    // 赋值从右到左
    workInProgressHook = workInProgressHook.next = hook
  }

  return hook
}

function updateWorkInProgressHook() {
  if (!currentHook) {
    const current = currentlyRenderingFiber.alternate
    currentHook = current.memoizedState
  } else {
    currentHook = currentHook.next
  }
  const newHook = {
    memoizedState: currentHook.memoizedState,
    queue: currentHook.queue,
    next: null
  }
  if (!workInProgressHook) {
    currentlyRenderingFiber.memoizedState = workInProgressHook = newHook
  } else {
    workInProgressHook = workInProgressHook.next = newHook
  }

  return newHook
}

/**
 * @param {import('./ReactFiber').FiberNode} current
 * @param {import('./ReactFiber').FiberNode} workInProgress
 * @param {(...args: any[]) => import('./ReactFiber').FiberNode} Component
 * @param {Record<string, any>} props
 */
export function renderWithHooks(current, workInProgress, Component, props) {
  currentlyRenderingFiber = workInProgress
  if (current && current.memoizedState) {
    ReactCurrentDispatcher.current = HooksDispatcherOnUpdate
  } else {
    ReactCurrentDispatcher.current = HooksDispatcherOnMount
  }
  const children = Component(props)
  currentlyRenderingFiber = null
  workInProgressHook = null
  currentHook = null
  return children
}
