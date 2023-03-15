import ReactCurrentDispatcher from './ReactCurrentDispatcher'

function resolveDispatcher() {
  return ReactCurrentDispatcher.current
}

export function useReducer(reducer, initialState) {
  const dispatcher = resolveDispatcher()
  return dispatcher.useReducer(reducer, initialState)
}

export function useState(initialState) {
  const dispatcher = resolveDispatcher()
  return dispatcher.useState(initialState)
}

export function useEffect(create, deps) {
  const dispatcher = resolveDispatcher()
  dispatcher.useEffect(create, deps)
}

export function useLayoutEffect(create, deps) {
  const dispatcher = resolveDispatcher()
  dispatcher.useLayoutEffect(create, deps)
}
