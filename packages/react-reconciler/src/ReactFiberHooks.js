import ReactSharedInternals from 'shared/ReactSharedInternals'

const { ReactCurrentDispatcher } = ReactSharedInternals
/**
 * @type {import('./ReactFiber').FiberNode}
 */
let currentRenderingFiber = null
let workInProgressHook = null

const HooksDispatcherOnMount = {
  useReducer: mountReducer
}

function mountReducer(reducer, initialArg) {
  const hook = mountWorkInProgressHook()
  hook.memoizedState = initialArg
  const queue = {
    pending: null
  }
  hook.queue = queue
  const dispatch = dispatchReducerAction.bind(null, currentRenderingFiber, queue)
  return [hook.memoizedState, dispatch]
}

/**
 * 更新状态，让界面重新更新
 * @param {import('./ReactFiber').FiberNode} fiber 
 * @param {*} queue 
 * @param {*} action 
 */
function dispatchReducerAction(fiber, queue, action) {
  debugger
}

function mountWorkInProgressHook() {
  const hook = {
    memoizedState: null,
    queue: null,
    next: null
  }

  if (!workInProgressHook) {
    currentRenderingFiber.memoizedState = workInProgressHook = hook
  } else {
    // 赋值从右到左
    workInProgressHook = workInProgressHook.next = hook
  }

  return hook
}

/**
 * @param {import('./ReactFiber').FiberNode} current
 * @param {import('./ReactFiber').FiberNode} workInProgress
 * @param {(...args: any[]) => import('./ReactFiber').FiberNode} Component
 * @param {Record<string, any>} props
 */
export function renderWithHooks(current, workInProgress, Component, props) {
  currentRenderingFiber = workInProgress
  ReactCurrentDispatcher.current = HooksDispatcherOnMount
  const children = Component(props)
  return children
}
