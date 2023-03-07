import { isArray } from 'shared/isArray'
import { REACT_ELEMENT_TYPE } from 'shared/ReactSymbols'
import { createFiberFromElement, createFiberFromText, createWorkInProgress } from './ReactFiber'
import { Placement } from './ReactFiberFlags'

/**
 * @param {boolean} shouldTrackSideEffects
 */
function createChildReconciler(shouldTrackSideEffects) {
  /**
   * @param {import('./ReactFiber').FiberNode} fiber 
   * @param {*} pendingProps 
   */
  function useFiber(fiber, pendingProps) {
    const clone = createWorkInProgress(fiber, pendingProps)
    clone.index = 0
    clone.sibling = null
    return clone
  }
  /**
   * @param {import('./ReactFiber').FiberNode} returnFiber
   * @param {import('./ReactFiber').FiberNode} currentFirstChild
   * @param {ReturnType<import('react/src/jsx/ReactJSXElement').ReactElement>} element
   */
  function reconcileSingleElement(returnFiber, currentFirstChild, element) {
    let child = currentFirstChild

    while(child) {
      if (child.key === element.key) {
        if (child.type === element.type) {
          const existing = useFiber(child, element.props)
          existing.return = returnFiber
          return existing
        }
      }
      child = child.sibling
    }

    const created = createFiberFromElement(element)
    created.return = returnFiber
    return created
  }

  /**
   *
   * @param {import('./ReactFiber').FiberNode} newFiber
   */
  function placeSingleChild(newFiber) {
    if (shouldTrackSideEffects && !newFiber.alternate) {
      newFiber.flags |= Placement
    }
    return newFiber
  }

  /**
   * @param {import('./ReactFiber').FiberNode} returnFiber 父 Fiber
   * @param {*} newChild
   */
  function createChild(returnFiber, newChild) {
    if ((typeof newChild === 'string' && newChild !== '') || typeof newChild === 'number') {
      // 转换为字符串
      const created = createFiberFromText(`${newChild}`)
      created.return = returnFiber
      return created
    } else if (typeof newChild === 'object' && newChild !== null) {
      switch (newChild.$$typeof) {
        case REACT_ELEMENT_TYPE: {
          const created = createFiberFromElement(newChild)
          created.return = returnFiber
          return created
        }
        default:
          break
      }
    }
    return null
  }

  /**
   *
   * @param {import('./ReactFiber').FiberNode} newFiber
   * @param {number} newIndex
   */
  function placeChild(newFiber, newIndex) {
    newFiber.index = newIndex

    if (shouldTrackSideEffects) {
      newFiber.flags |= Placement
    }
  }

  /**
   * @param {import('./ReactFiber').FiberNode} returnFiber 父 Fiber
   * @param {import('./ReactFiber').FiberNode} currentFirstChild current 第一个子 Fiber
   * @param {any[]} newChildren 新的子虚拟 DOM
   */
  function reconcileChildrenArray(returnFiber, currentFirstChild, newChildren) {
    let newIndex = 0
    // 记录第一个子节点
    let resultingFirstChild = null
    /**
     * 用于辅助构建子节点的链接关系
     * @type {import('./ReactFiber').FiberNode}
     */
    let previousNewFiber = null

    for (; newIndex < newChildren.length; newIndex++) {
      const newFiber = createChild(returnFiber, newChildren[newIndex])
      if (!newFiber) continue
      placeChild(newFiber, newIndex)
      if (!previousNewFiber) {
        resultingFirstChild = newFiber
      } else {
        previousNewFiber.sibling = newFiber
      }
      previousNewFiber = newFiber
    }

    return resultingFirstChild
  }

  /**
   * @param {import('./ReactFiber').FiberNode} returnFiber 父 Fiber
   * @param {import('./ReactFiber').FiberNode} currentFirstChild current 第一个子 Fiber
   * @param {*} newChild 新的子虚拟 DOM
   */
  function reconcilerChildFibers(returnFiber, currentFirstChild, newChild) {
    if (isArray(newChild)) {
      return reconcileChildrenArray(returnFiber, currentFirstChild, newChild)
    } else if (typeof newChild === 'object' && newChild !== null) {
      switch (newChild.$$typeof) {
        case REACT_ELEMENT_TYPE:
          return placeSingleChild(reconcileSingleElement(returnFiber, currentFirstChild, newChild))
        default:
          break
      }
    }
  }

  return reconcilerChildFibers
}

export const mountChildFibers = createChildReconciler(false)
export const reconcileChildFibers = createChildReconciler(true)
