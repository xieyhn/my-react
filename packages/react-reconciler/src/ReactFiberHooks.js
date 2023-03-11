import ReactSharedInternals from 'shared/ReactSharedInternals'
import { enqueueConcurrentHookUpdate } from './ReactFiberConcurrentUpdates'
import { scheduleUpdateOnFiber } from './ReactFiberWorkLoop'
import { Passive as PassiveEffect } from './ReactFiberFlags'
import { HasEffect as HookHasEffect, Passive as HookPassive } from './ReactHookEffectTags'

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
  useState: mountState,
  useEffect: mountEffect
}

const HooksDispatcherOnUpdate = {
  useReducer: updateReducer,
  useState: updateState,
  useEffect: updateEffect
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
  const dispatch = (queue.dispatch = dispatchSetState.bind(null, currentlyRenderingFiber, queue))
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
    next: null
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

/**
 * @param {() => (void | () => void)} create
 * @param {any[]} deps
 */
function mountEffect(create, deps) {
  return mountEffectImpl(PassiveEffect, HookPassive, create, deps)
}

function updateEffect(create, deps) {
  return updateEffectImpl(PassiveEffect, HookPassive, create, deps)
}

/**
 * @param {number} fiberFlags
 * @param {number} hookFlags
 * @param {*} create
 * @param {any[]} deps
 */
function mountEffectImpl(fiberFlags, hookFlags, create, deps) {
  const hook = mountWorkInProgressHook()
  const nextDeps = typeof deps === 'undefined' ? null : deps
  currentlyRenderingFiber.flags |= fiberFlags
  hook.memoizedState = pushEffect(HookHasEffect | hookFlags, create, undefined, nextDeps)
}

function pushEffect(tag, create, destroy, deps) {
  const effect = {
    tag,
    create,
    destroy,
    deps,
    next: null
  }
  let componentUpdateQueue = currentlyRenderingFiber.updateQueue
  if (!componentUpdateQueue) {
    componentUpdateQueue = currentlyRenderingFiber.updateQueue =
      createFunctionComponentUpdateQueue()
    componentUpdateQueue.lastEffect = effect.next = effect
  } else {
    const lastEffect = componentUpdateQueue.lastEffect
    if (!lastEffect) {
      componentUpdateQueue.lastEffect = effect.next = effect
    } else {
      const firstEffect = lastEffect.next
      lastEffect.next = effect
      effect.next = firstEffect
      componentUpdateQueue.lastEffect = effect
    }
  }

  return effect
}

function createFunctionComponentUpdateQueue() {
  return {
    lastEffect: null
  }
}

/**
 * @param {number} fiberFlags
 * @param {number} hookFlags
 * @param {*} create
 * @param {any[]} deps
 */
function updateEffectImpl(fiberFlags, hookFlags, create, deps) {
  const hook = updateWorkInProgressHook()
  const nextDeps = deps || null
  let destroy
  if (currentHook) {
    const prevEffect = currentHook.memoizedState
    destroy = prevEffect.destroy
    if (nextDeps) {
      const prevDeps = prevEffect.deps
      if (areHookInputsEqual(nextDeps, prevDeps)) {
        hook.memoizedState = pushEffect(hookFlags, create, destroy, nextDeps)
        return
      }
    }
  }
  currentlyRenderingFiber.flags |= fiberFlags
  hook.memoizedState = pushEffect(HookHasEffect | hookFlags, create, destroy, nextDeps)
}

function areHookInputsEqual(nextDeps, prevDeps) {
  if (!prevDeps || !nextDeps) {
    return false
  }
  for (let i = 0; i < nextDeps.length && i < prevDeps.length; i++) {
    if (Object.is(nextDeps[i], prevDeps[i])) {
      continue
    }
    return false
  }

  return true
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
  workInProgress.updateQueue = null
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
