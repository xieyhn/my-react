import { setValueForStyles } from './CSSPropertyOperations'
import { setValueForProperty } from './DOMPropertyOperations'
import setTextContent from './setTextContent'

const STYLE = 'style'
const CHILDREN = 'children'

/**
 * @param {string} type
 * @param {HTMLElement} domElement
 * @param {Record<string, any>} nextProps
 */
function setInitialDOMProperties(type, domElement, nextProps) {
  for (const key in nextProps) {
    if (nextProps.hasOwnProperty(key)) {
      const value = nextProps[key]
      if (key === STYLE) {
        setValueForStyles(domElement, value)
      } else if (key === CHILDREN) {
        if (typeof value === 'string' || typeof value === 'number') {
          // 唯一的文本节点会被放置在 children 中
          setTextContent(domElement, value)
        }
      } else if (value !== null) {
        setValueForProperty(domElement, key, value)
      }
    }
  }
}

/**
 * @param {HTMLElement} domElement
 * @param {string} type
 * @param {*} props
 */
export function setInitialProperties(domElement, type, props) {
  setInitialDOMProperties(type, domElement, props)
}

/**
 * @param {HTMLElement} domElement
 * @param {*} type
 * @param {*} oldProps
 * @param {*} newProps
 */
export function diffProperties(domElement, type, oldProps, newProps) {
  // TODO
}
