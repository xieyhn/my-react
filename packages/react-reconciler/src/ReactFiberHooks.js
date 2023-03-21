import ReactSharedInternals from 'shared/ReactSharedInternals'
import { enqueueConcurrentHookUpdate } from './ReactFiberConcurrentUpdates'
import { requestEventTime, requestUpdateLane, scheduleUpdateOnFiber } from './ReactFiberWorkLoop'
import { Passive as PassiveEffect, Update as UpdateEffect } from './ReactFiberFlags'
import {
  HasEffect as HookHasEffect,
  Passive as HookPassive,
  Layout as HookLayout
} from './ReactHookEffectTags'
import { isSubsetOfLanes, mergeLanes, NoLane, NoLanes } from './ReactFiberLane'

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
let renderLanes = NoLanes

const HooksDispatcherOnMount = {
  useReducer: mountReducer,
  useState: mountState,
  useEffect: mountEffect,
  useLayoutEffect: mountLayoutEffect,
  useRef: mountRef
}

const HooksDispatcherOnUpdate = {
  useReducer: updateReducer,
  useState: updateState,
  useEffect: updateEffect,
  useLayoutEffect: updateLayoutEffect,
  useRef: updateRef
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
    dispatch: null,
    lastRenderedReducer: reducer,
    lastRenderedState: initialState
  }
  const dispatch = dispatchReducerAction.bind(null, currentlyRenderingFiber, queue)
  hook.queue = queue
  queue.dispatch = dispatch
  return [hook.memoizedState, dispatch]
}

function updateReducer(reducer) {
  const hook = updateWorkInProgressHook()
  const queue = hook.queue
  queue.lastRenderedReducer = reducer
  const current = currentHook
  let baseQueue = current.baseQueue
  const pendingQueue = queue.pending
  if (pendingQueue) {
    if (baseQueue) {
      const baseFirst = baseQueue.next
      const pendingFirst = pendingQueue.next
      baseQueue.next = pendingFirst
      pendingQueue.next = baseFirst
    }
    current.baseQueue = baseQueue = pendingQueue
    queue.pending = null
  }
  if (baseQueue) {
    const first = baseQueue.next
    let newState = current.baseState
    let newBaseState = null
    let newBaseQueueFirst = null
    let newBaseQueueLast = null
    let update = first

    do {
      const updateLane = update.lane
      const shouldSkipUpdate = !isSubsetOfLanes(renderLanes, updateLane)
      if (shouldSkipUpdate) {
        const clone = {
          lane: updateLane,
          action: update.action,
          hasEagerState: update.hasEagerState,
          eagerState: update.eagerState,
          next: null
        }
        if (!newBaseQueueLast) {
          newBaseQueueFirst = newBaseQueueLast = clone
          newBaseState = newState
        } else {
          newBaseQueueLast = newBaseQueueLast.next = clone
        }
        currentlyRenderingFiber.lanes = mergeLanes(currentlyRenderingFiber.lanes, updateLane)
      } else {
        if (newBaseQueueLast) {
          const clone = {
            lane: NoLane,
            action: update.action,
            hasEagerState: update.hasEagerState,
            eagerState: update.eagerState,
            next: null
          }
          newBaseQueueLast = newBaseQueueLast.next = clone
        }
        if (update.hasEagerState) {
          newState = update.eagerState
        } else {
          const action = update.action
          newState = reducer(newState, action)
        }
      }
      update = update.next
    } while(update && update !== first)
    if (!newBaseQueueLast) {
      newBaseState = newState
    } else {
      newBaseQueueLast.next = newBaseQueueFirst
    }
    hook.memoizedState = newState
    hook.baseState = newBaseState
    hook.baseQueue = newBaseQueueLast
    queue.lastRenderedState = newState
  }
  if (!baseQueue) {
    queue.lanes = NoLanes
  }
  return [hook.memoizedState, queue.dispatch]
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
  const eventTime = requestEventTime()
  scheduleUpdateOnFiber(root, fiber, lane, eventTime)
}

function mountState(initialState) {
  const hook = mountWorkInProgressHook()
  hook.memoizedState = hook.baseState = initialState
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
  const lane = requestUpdateLane()
  const update = {
    lane,
    action,
    // 是否有急切的更新状态，在 useState 中，如果新旧两个值相同，不会进行页面更新，因此这里会同步计算新值并保存
    hasEagerState: false,
    eagerState: null,
    next: null
  }
  if (fiber.lanes === NoLanes && (!fiber.alternate || fiber.lanes === NoLanes)) {
    const { lastRenderedReducer, lastRenderedState } = queue
    const eagerState = lastRenderedReducer(lastRenderedState, action)
    update.hasEagerState = true
    update.eagerState = eagerState
    if (Object.is(eagerState, lastRenderedState)) {
      // useState 优化，在新旧值相同的情况下，不会进入更新
      return
    }
  }
  const root = enqueueConcurrentHookUpdate(fiber, queue, update, lane)
  const eventTime = requestEventTime()
  scheduleUpdateOnFiber(root, fiber, lane, eventTime)
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

/**
 * @param {() => (void | () => void)} create
 * @param {any[]} deps
 */
function mountLayoutEffect(create, deps) {
  return mountEffectImpl(UpdateEffect, HookLayout, create, deps)
}

/**
 * @param {() => (void | () => void)} create
 * @param {any[]} deps
 */
function updateLayoutEffect(create, deps) {
  return updateEffectImpl(UpdateEffect, HookLayout, create, deps)
}

function mountRef(initialValue) {
  const hook = mountWorkInProgressHook()
  const ref = {
    current: initialValue
  }
  hook.memoizedState = ref
  return ref
}

function updateRef() {
  const hook = updateWorkInProgressHook()
  return hook.memoizedState
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
    next: null,
    // 跳过前的末状态值
    baseState: null,
    // 跳过的更新链表
    baseQueue: null
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
    next: null,
    baseState: currentHook.baseState,
    baseQueue: currentHook.baseQueue
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
export function renderWithHooks(current, workInProgress, Component, props, nextRenderLanes) {
  renderLanes = nextRenderLanes
  currentlyRenderingFiber = workInProgress
  workInProgress.updateQueue = null
  workInProgress.memoizedState = null
  if (current && current.memoizedState) {
    ReactCurrentDispatcher.current = HooksDispatcherOnUpdate
  } else {
    ReactCurrentDispatcher.current = HooksDispatcherOnMount
  }
  const children = Component(props)
  currentlyRenderingFiber = null
  workInProgressHook = null
  currentHook = null
  renderLanes = NoLanes
  return children
}
