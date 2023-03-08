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
  useReducer: mountReducer,
  useState: mountState
}

const HooksDispatcherOnUpdate = {
  useReducer: updateReducer,
  useState: updateState
}

function baseStateReducer(state, action) {
  if (typeof action === 'function') {
    return action(state)
  }
  return action
}

function mountReducer(reducer, initialState) {
  const hook = mountWorkInProgressHook()
  hook.memoizedState = initialState
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
      if (update.hasEagerState) {
        newState = update.eagerState
      } else {
        newState = reducer(newState, update.action)
      }
      update = update.next
    } while (update && update !== firstUpdate)
  }

  hook.memoizedState = newState
  return [newState, queue.dispatch]
}

/**
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

function mountState(initialState) {
  const hook = mountWorkInProgressHook()
  hook.memoizedState = initialState
  const queue = {
    pending: null,
    dispatch: null,
    lastRenderedReducer: baseStateReducer,
    lastRenderedState: initialState
  }
  hook.queue = queue
  const dispatch = queue.dispatch = dispatchSetState.bind(null, currentlyRenderingFiber, queue)
  return [hook.memoizedState, dispatch]
}

function updateState() {
  return updateReducer(baseStateReducer)
}

/**
 * @param {import('./ReactFiber').FiberNode} fiber
 * @param {*} queue
 * @param {*} action
 */
function dispatchSetState(fiber, queue, action) {
  const update = {
    action,
    // 是否有急切的更新状态，在 useState 中，如果新旧两个值相同，不会进行页面更新，因此这里会同步计算新值并保存
    hasEagerState: false,
    eagerState: null,
    next: null,
  }
  const { lastRenderedReducer, lastRenderedState } = queue
  const eagerState = lastRenderedReducer(lastRenderedState, action)
  update.hasEagerState = true
  update.eagerState = eagerState
  if (Object.is(eagerState, lastRenderedState)) {
    // useState 优化，在新旧值相同的情况下，不会进入更新
    return
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
