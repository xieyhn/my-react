import { diffProperties, setInitialProperties, updateProperties } from './ReactDOMComponent'
import { precacheFiberNode, updateFiberProps } from './ReactDOMComponentTree'

export function shouldSetTextContent(type, props) {
  return /string|number/.test(typeof props.children)
}

export function createTextInstance(content) {
  return window.document.createTextNode(content)
}

/**
 *
 * @param {string} type
 * @param {*} newProps
 * @param {import('react-reconciler/src/ReactFiber').FiberNode} workInProgress
 */
export function createInstance(type, newProps, workInProgress) {
  const domElement = window.document.createElement(type)
  precacheFiberNode(workInProgress, domElement)
  updateFiberProps(domElement, newProps)
  return domElement
}

export function appendInitialChild(parent, child) {
  parent.appendChild(child)
}

/**
 * @param {HTMLElement} domElement
 * @param {string} type
 * @param {*} props
 */
export function finalizeInitialChildren(domElement, type, props) {
  setInitialProperties(domElement, type, props)
}

/**
 * 
 * @param {HTMLElement} parentInstance 
 * @param {HTMLElement} child 
 */
export function appendChild(parentInstance, child) {
  parentInstance.appendChild(child)
}

/**
 * @param {HTMLElement} parentInstance 
 * @param {HTMLElement} child 
 * @param {HTMLElement} anchor 
 */
export function insertBefore(parentInstance, child, anchor) {
  parentInstance.insertBefore(child, anchor)
}

/**
 * @param {HTMLElement} domElement 
 * @param {*} type 
 * @param {*} oldProps 
 * @param {*} newProps 
 */
export function prepareUpdate(domElement, type, oldProps, newProps) {
  return diffProperties(domElement, type, oldProps, newProps)
}

/**
 * @param {HTMLElement} domElement 
 * @param {*} updatePayload 
 * @param {*} type 
 * @param {*} oldProps 
 * @param {*} newProps 
 * @param {*} finishedWork 
 */
export function commitUpdate(domElement, updatePayload, type, oldProps, newProps, finishedWork) {
  updateProperties(domElement, updatePayload)
  updateFiberProps(domElement, newProps)
}

/**
 * @param {HTMLElement} parent 
 * @param {HTMLElement} child 
 */
export function removeChild(parent, child) {
  parent.removeChild(child)
}
