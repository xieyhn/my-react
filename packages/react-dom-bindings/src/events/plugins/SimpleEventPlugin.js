import { registerSimpleEvents, topLevelEventsToReactNames } from '../DOMEventProperties'
import { accumulateSinglePhaseListeners } from '../DOMPluginEventSystem'
import { IS_CAPTURE_PHASE } from '../EventSystemFlags'
import { SyntheticMouseEvent } from '../SyntheticEvent'

/**
 * @param {any[]} dispatchQueue
 * @param {string} domEventName
 * @param {import('react-reconciler/src/ReactFiber').FiberNode} targetInstance
 * @param {Event} nativeEvent
 * @param {HTMLElement} nativeEventTarget
 * @param {number} eventSystemFlags
 * @param {HTMLElement} targetContainer
 */
export function extractEvents(
  dispatchQueue,
  domEventName,
  targetInstance,
  nativeEvent,
  nativeEventTarget,
  eventSystemFlags,
  targetContainer
) {
  const isCapturePhase = (eventSystemFlags & IS_CAPTURE_PHASE) !== 0

  const reactName = topLevelEventsToReactNames.get(domEventName)
  let SyntheticEventCtor = null
  let reactEventType = domEventName

  switch (domEventName) {
    case 'click':
      SyntheticEventCtor = SyntheticMouseEvent
      break
    default:
      break
  }

  const listeners = accumulateSinglePhaseListeners(
    targetInstance,
    reactName,
    nativeEvent.type,
    isCapturePhase
  )

  if (listeners.length) {
    const event = new SyntheticEventCtor(
      reactName,
      reactEventType,
      null,
      nativeEvent,
      nativeEventTarget
    )
    dispatchQueue.push({
      event,
      listeners
    })
  }
}

export { registerSimpleEvents as registerEvents }
