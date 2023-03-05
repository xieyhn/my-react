/**
 * @param {HTMLElement} domElement
 * @param {string} key
 * @param {*} value
 */
export function setValueForProperty(domElement, key, value) {
  if (value === null) {
    domElement.removeAttribute(key)
  } else {
    domElement.setAttribute(key, value)
  }
}
