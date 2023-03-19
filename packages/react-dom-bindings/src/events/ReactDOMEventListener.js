import { ContinuousEventPriority, DefaultEventPriority, DiscreteEventPriority } from 'react-reconciler/src/ReactEventProperties'
import { getClosestInstanceFromNode } from '../client/ReactDOMComponentTree'
import { dispatchEventForPluginEventSystem } from './DOMPluginEventSystem'
import getEventTarget from './getEventTarget'

/**
 * @param {HTMLElement} targetContainer
 * @param {string} domEventName
 * @param {number} eventSystemFlags
 */
export function createEventListenerWrapperWithPriority(
  targetContainer,
  domEventName,
  eventSystemFlags
) {
  const listenerWrapper = dispatchDiscreteEvent
  return listenerWrapper.bind(null, domEventName, eventSystemFlags, targetContainer)
}

/**
 * 派发离散的事件的监听函数，如 click 等一次一次触发的
 * @param {string} domEventName
 * @param {number} eventSystemFlags
 * @param {HTMLElement} targetContainer
 * @param {string} nativeEvent
 */
function dispatchDiscreteEvent(domEventName, eventSystemFlags, targetContainer, nativeEvent) {
  dispatchEvent(domEventName, eventSystemFlags, targetContainer, nativeEvent)
}

/**
 * @param {string} domEventName
 * @param {number} eventSystemFlags
 * @param {HTMLElement} targetContainer
 * @param {Event} nativeEvent
 */
export function dispatchEvent(domEventName, eventSystemFlags, targetContainer, nativeEvent) {
  const nativeEventTarget = getEventTarget(nativeEvent)
  const targetInstance = getClosestInstanceFromNode(nativeEventTarget)
  dispatchEventForPluginEventSystem(
    domEventName,
    eventSystemFlags,
    nativeEvent,
    targetInstance,
    targetContainer
  )
}

/**
 * @param {string} domEventName 
 */
export function getEventPriority(domEventName) {
  switch(domEventName) {
    case 'click':
      return DiscreteEventPriority
    case 'drag':
      return ContinuousEventPriority
    default:
      return DefaultEventPriority
  }
}
