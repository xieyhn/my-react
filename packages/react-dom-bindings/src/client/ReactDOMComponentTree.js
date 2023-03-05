const randomKey = Math.random().toString(36).slice(2)

const internalInstanceKey = '__reactFiber$' + randomKey
const internalPropsKey = '__reactProps$' + randomKey

/**
 * 从 DOM 节点获取 Fiber
 * @param {HTMLElement} targetNode
 * @returns {import('react-reconciler/src/ReactFiber').FiberNode}
 */
export function getClosestInstanceFromNode(targetNode) {
  const targetInstance = targetNode[internalInstanceKey]
  return targetInstance
}

/**
 * @param {import('react-reconciler/src/ReactFiber').FiberNode} fiber 
 * @param {HTMLElement} domElement 
 */
export function precacheFiberNode(fiber, domElement) {
  domElement[internalInstanceKey] = fiber
}

/**
 * @param {HTMLElement} domElement 
 * @param {*} props
 */
export function updateFiberProps(domElement, props) {
  domElement[internalPropsKey] = props
}

/**
 * @param {HTMLElement} domElement 
 */
export function getFiberCurrentPropsFromNode(domElement) {
  return domElement[internalPropsKey] || null
}
