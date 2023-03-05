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
        if (typeof value === 'string') {
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
 * @param {string} tag
 * @param {*} props
 */
export function setInitialProperties(domElement, tag, props) {
  setInitialDOMProperties(tag, domElement, props)
}
