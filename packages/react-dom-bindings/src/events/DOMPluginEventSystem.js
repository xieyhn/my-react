import { HostComponent } from 'react-reconciler/src/ReactWorkTags'
import { addEventBubbleListener, addEventCaptureListener } from './EventListener'
import { allNativeEvents } from './EventRegistry'
import { IS_CAPTURE_PHASE } from './EventSystemFlags'
import getEventTarget from './getEventTarget'
import getListener from './getListener'
import * as SimpleEventPlugin from './plugins/SimpleEventPlugin'
import { createEventListenerWrapperWithPriority } from './ReactDOMEventListener'

SimpleEventPlugin.registerEvents()

const listeningMarker = `_reactListening` + Math.random().toString(36).slice(2)

/**
 * @param {HTMLElement} rootContainerElement
 */
export function listenToAllSupportedEvents(rootContainerElement) {
  if (!rootContainerElement[listeningMarker]) {
    rootContainerElement[listeningMarker] = true
    allNativeEvents.forEach(domEventName => {
      listenToNativeEvent(domEventName, true, rootContainerElement)
      listenToNativeEvent(domEventName, false, rootContainerElement)
    })
  }
}

/**
 * @param {string} domEventName
 * @param {boolean} isCapturePhaseListener
 * @param {HTMLElement} target
 */
export function listenToNativeEvent(domEventName, isCapturePhaseListener, target) {
  let eventSystemFlags = 0
  if (isCapturePhaseListener) {
    eventSystemFlags |= IS_CAPTURE_PHASE
  }
  addTrappedEventListener(target, domEventName, eventSystemFlags, isCapturePhaseListener)
}

/**
 * @param {HTMLElement} targetContainer
 * @param {string} domEventName
 * @param {number} eventSystemFlags
 * @param {boolean} isCapturePhaseListener
 */
function addTrappedEventListener(
  targetContainer,
  domEventName,
  eventSystemFlags,
  isCapturePhaseListener
) {
  const listener = createEventListenerWrapperWithPriority(
    targetContainer,
    domEventName,
    eventSystemFlags
  )
  if (isCapturePhaseListener) {
    addEventCaptureListener(targetContainer, domEventName, listener)
  } else {
    addEventBubbleListener(targetContainer, domEventName, listener)
  }
}

/**
 * @param {string} domEventName
 * @param {number} eventSystemFlags
 * @param {Event} nativeEvent
 * @param {import('react-reconciler/src/ReactFiber').FiberNode} targetInstance
 * @param {HTMLElement} targetContainer
 */
export function dispatchEventForPluginEventSystem(
  domEventName,
  eventSystemFlags,
  nativeEvent,
  targetInstance,
  targetContainer
) {
  dispatchEventForPlugins(
    domEventName,
    eventSystemFlags,
    nativeEvent,
    targetInstance,
    targetContainer
  )
}

/**
 * @param {string} domEventName
 * @param {number} eventSystemFlags
 * @param {Event} nativeEvent
 * @param {import('react-reconciler/src/ReactFiber').FiberNode} targetInstance
 * @param {HTMLElement} targetContainer
 */
function dispatchEventForPlugins(
  domEventName,
  eventSystemFlags,
  nativeEvent,
  targetInstance,
  targetContainer
) {
  const nativeEventTarget = getEventTarget(nativeEvent)
  const dispatchQueue = []
  extractEvents(
    dispatchQueue,
    domEventName,
    targetInstance,
    nativeEvent,
    nativeEventTarget,
    eventSystemFlags,
    targetContainer
  )
  processDispatchQueue(dispatchQueue, eventSystemFlags)
}

function processDispatchQueue(dispatchQueue, eventSystemFlags) {
  const inCapturePhase = (eventSystemFlags & IS_CAPTURE_PHASE) !== 0

  dispatchQueue.forEach(({ event, listeners }) => {
    processDispatchQueueItemsInOrder(event, listeners, inCapturePhase)
  })
}

function executeDispatch(event, listener, currentTarget) {
  event.currentTarget = currentTarget
  listener(event)
}

/**
 * @param {*} event
 * @param {any[]} dispatchListeners
 * @param {boolean} inCapturePhase
 */
function processDispatchQueueItemsInOrder(event, dispatchListeners, inCapturePhase) {
  if (inCapturePhase) {
    for (let i = dispatchListeners.length - 1; i >= 0; i--) {
      if (event.isPropagationStopped()) {
        return
      }
      const { listener, currentTarget } = dispatchListeners[i]
      executeDispatch(event, listener, currentTarget)
    }
  } else {
    for (let i = 0; i < dispatchListeners.length; i++) {
      if (event.isPropagationStopped()) {
        return
      }
      const { listener, currentTarget } = dispatchListeners[i]
      executeDispatch(event, listener, currentTarget)
    }
  }
}

/**
 * @param {any[]} dispatchQueue
 * @param {string} domEventName
 * @param {import('react-reconciler/src/ReactFiber').FiberNode} targetInstance
 * @param {Event} nativeEvent
 * @param {HTMLElement} nativeEventTarget
 * @param {number} eventSystemFlags
 * @param {HTMLElement} targetContainer
 */
function extractEvents(
  dispatchQueue,
  domEventName,
  targetInstance,
  nativeEvent,
  nativeEventTarget,
  eventSystemFlags,
  targetContainer
) {
  SimpleEventPlugin.extractEvents(
    dispatchQueue,
    domEventName,
    targetInstance,
    nativeEvent,
    nativeEventTarget,
    eventSystemFlags,
    targetContainer
  )
}

/**
 *
 * @param {import('react-reconciler/src/ReactFiber').FiberNode} targetFiber
 * @param {string} reactName
 * @param {Event['type']} nativeEventType
 * @param {boolean} isCapturePhase
 */
export function accumulateSinglePhaseListeners(
  targetFiber,
  reactName,
  nativeEventType,
  isCapturePhase
) {
  const reactEventName = isCapturePhase ? reactName + 'Capture' : reactName
  const listeners = []

  let instance = targetFiber
  while (instance) {
    const { stateNode, tag } = instance
    if (tag === HostComponent && stateNode) {
      const listener = getListener(instance, reactEventName)
      if (listener) listeners.push(createDispatchListener(instance, listener, stateNode))
    }
    instance = instance.return
  }

  return listeners
}

function createDispatchListener(instance, listener, currentTarget) {
  return {
    instance,
    listener,
    currentTarget
  }
}
