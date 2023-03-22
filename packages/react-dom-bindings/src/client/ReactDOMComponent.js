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
  const styleUpdates = {}
  const updatePayload = []

  for (const key in oldProps) {
    const oldValue = oldProps[key]
    if (key === STYLE) {
      const newStyles = newProps[key]
      for (const styleName in oldValue) {
        if (!newStyles || !newStyles.hasOwnProperty(styleName)) {
          // 新的 style 没有此值，删除
          styleUpdates[styleName] = ''
        }
      }
    } else {
      // new props 没有此 key，标记删除
      if (!newProps.hasOwnProperty(key)) {
        updatePayload.push(key, null)
      }
    }
  }

  for (const key in newProps) {
    const newValue = newProps[key]

    if (key === STYLE) {
      Object.assign(styleUpdates, newValue)
    } else if (key === CHILDREN) {
      // 独立的文本子节点当普通属性处理
      if (typeof newValue === 'string' || typeof newValue === 'number') {
        updatePayload.push(key, newValue)
      }
    } else {
      if (newValue !== oldProps[key]) {
        updatePayload.push(key, newValue)
      }
    }
  }

  updatePayload.push(STYLE, styleUpdates)

  return updatePayload
}

export function updateProperties(domElement, updatePayload) {
  updateDOMProperties(domElement, updatePayload)
}

/**
 * @param {HTMLElement} domElement
 * @param {any[]} updatePayload
 */
function updateDOMProperties(domElement, updatePayload) {
  for (let i = 0; i < updatePayload.length; i += 2) {
    const key = updatePayload[i]
    const value = updatePayload[i + 1]

    if (key === STYLE) {
      setValueForStyles(domElement, value)
    } else if (key === CHILDREN) {
      setTextContent(domElement, String(value))
    } else {
      setValueForProperty(domElement, key, value)
    }
  }
}
