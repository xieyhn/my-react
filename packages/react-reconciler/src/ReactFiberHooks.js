/**
 * @param {import('./ReactFiber').FiberNode} current
 * @param {import('./ReactFiber').FiberNode} workInProgress
 * @param {(...args: any[]) => import('./ReactFiber').FiberNode} Component
 * @param {Record<string, any>} props
 */
export function renderWithHooks(current, workInProgress, Component, props) {
  const children = Component(props)
  return children
}
