import { getFiberCurrentPropsFromNode } from '../client/ReactDOMComponentTree'

/**
 * @param {import('react-reconciler/src/ReactFiber').FiberNode} instance
 * @param {string} reactEventName
 */
export default function getListener(instance, reactEventName) {
  const { stateNode } = instance
  if (!stateNode) return null
  const props = getFiberCurrentPropsFromNode(stateNode)
  if (!props) return null
  const listener = props[reactEventName]
  return listener
}
