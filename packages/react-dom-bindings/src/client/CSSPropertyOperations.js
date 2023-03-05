/**
 * @param {HTMLElement} domElement
 * @param {Record<string, any>} prop
 */
export function setValueForStyles(domElement, styles) {
  for (const key in styles) {
    if (styles.hasOwnProperty(key)) {
      domElement.style[key] = styles[key]
    }
  }
}
