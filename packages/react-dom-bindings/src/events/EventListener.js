/**
 * @param {HTMLElement} target
 * @param {string} eventType
 * @param {*} listener
 */
export function addEventCaptureListener(target, eventType, listener) {
  target.addEventListener(eventType, listener, true)
}

/**
 * @param {HTMLElement} target
 * @param {string} eventType
 * @param {*} listener
 */
export function addEventBubbleListener(target, eventType, listener) {
  target.addEventListener(eventType, listener, false)
}
