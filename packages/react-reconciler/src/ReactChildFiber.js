import { isArray } from 'shared/isArray'
import { REACT_ELEMENT_TYPE } from 'shared/ReactSymbols'
import { createFiberFromElement, createFiberFromText, createWorkInProgress } from './ReactFiber'
import { ChildDeletion, Placement } from './ReactFiberFlags'
import { HostText } from './ReactWorkTags'

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
   * @param {import('./ReactFiber').FiberNode} childToDelete
   */
  function deleteChild(returnFiber, childToDelete) {
    if (!shouldTrackSideEffects) {
      return
    }
    const deletions = returnFiber.deletions
    if (!deletions) {
      returnFiber.deletions = [childToDelete]
      // 标记有子节点被删除
      returnFiber.flags |= ChildDeletion
    } else {
      returnFiber.deletions.push(childToDelete)
    }
  }

  /**
   * 移除 currentFirstChild 后面所有的兄弟节点
   * @param {import('./ReactFiber').FiberNode} returnFiber
   * @param {import('./ReactFiber').FiberNode} currentFirstChild
   */
  function deleteRemainingChildren(returnFiber, currentFirstChild) {
    if (!shouldTrackSideEffects) return
    let childToDelete = currentFirstChild
    while (childToDelete) {
      deleteChild(returnFiber, childToDelete)
      childToDelete = childToDelete.sibling
    }
  }

  /**
   * 对新节点是单个节点的情况做差异处理
   * @param {import('./ReactFiber').FiberNode} returnFiber
   * @param {import('./ReactFiber').FiberNode} currentFirstChild
   * @param {ReturnType<import('react/src/jsx/ReactJSXElement').ReactElement>} element
   */
  function reconcileSingleElement(returnFiber, currentFirstChild, element) {
    let child = currentFirstChild

    while (child) {
      // key、type 相同表示同一个元素
      if (child.key === element.key) {
        if (child.type === element.type) {
          // 找到可复用的目标，删除剩余的兄弟节点
          deleteRemainingChildren(returnFiber, child.sibling)
          const existing = useFiber(child, element.props)
          existing.return = returnFiber
          return existing
        } else {
          // key 相同但 type 不同，也不可复用，直接删除当前节点及节点的后面兄弟节点
          deleteRemainingChildren(returnFiber, child)
        }
      } else {
        // key 不同，删除老节点
        deleteChild(returnFiber, child)
      }
      child = child.sibling
    }

    // 上面循环没有找到可复用的节点，这里创建新的
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
   * @param {import('./ReactFiber').FiberNode} newFiber
   * @param {number} lastPlacedIndex
   * @param {number} newIndex
   */
  function placeChild(newFiber, lastPlacedIndex, newIndex) {
    newFiber.index = newIndex
    if (!shouldTrackSideEffects) {
      return
    }
    if (newFiber.alternate) {
      // 是复用的 fiber，存在 DOM
      const oldIndex = newFiber.alternate.index
      if (oldIndex < lastPlacedIndex) {
        newFiber.flags |= Placement
        return lastPlacedIndex
      } else {
        return oldIndex
      }
    } else {
      newFiber.flags |= Placement
      return lastPlacedIndex
    }
  }

  /**
   *
   * @param {import('./ReactFiber').FiberNode} returnFiber
   * @param {import('./ReactFiber').FiberNode} current
   * @param {ReturnType<import('react/src/jsx/ReactJSXElement').ReactElement>} element
   */
  function updateElement(returnFiber, current, element) {
    const elementType = element.type
    if (current) {
      if (current.type === elementType) {
        const existing = useFiber(current, element.props)
        existing.return = returnFiber
        return existing
      }
    }
    const created = createFiberFromElement(element)
    created.return = returnFiber
    return created
  }

  /**
   *
   * @param {import('./ReactFiber').FiberNode} returnFiber
   * @param {import('./ReactFiber').FiberNode} oldFiber
   * @param {ReturnType<import('react/src/jsx/ReactJSXElement').ReactElement>} newChild
   */
  function updateSlot(returnFiber, oldFiber, newChild) {
    const key = oldFiber && oldFiber.key

    if (typeof newChild === 'object' && newChild !== null) {
      switch (newChild.$$typeof) {
        case REACT_ELEMENT_TYPE:
          if (newChild.key === key) {
            return updateElement(returnFiber, oldFiber, newChild)
          }
          break
        default:
          break
      }
    }
  }

  /**
   * @param {import('./ReactFiber').FiberNode} returnFiber 父 Fiber
   * @param {import('./ReactFiber').FiberNode} currentFirstChild current 第一个子 Fiber
   */
  function mapRemainingChildren(returnFiber, currentFirstChild) {
    // 记录还存在的
    const existingChildren = new Map()
    let existingFirstChild = currentFirstChild

    while (existingFirstChild) {
      if (typeof existingFirstChild.key !== 'undefined' && existingFirstChild.key !== null) {
        existingChildren.set(existingFirstChild.key, existingFirstChild)
      } else {
        existingChildren.set(existingFirstChild.index, existingFirstChild)
      }

      existingFirstChild = existingFirstChild.sibling
    }

    return existingChildren
  }

  /**
   * @param {import('./ReactFiber').FiberNode} returnFiber
   * @param {import('./ReactFiber').FiberNode} current
   * @param {string} textContent
   */
  function updateTextNode(returnFiber, current, textContent) {
    if (!current || current.tag !== HostText) {
      const created = createFiberFromText(textContent)
      created.return = returnFiber
      return created
    } else {
      const existing = useFiber(current, textContent)
      existing.return = returnFiber
      return existing
    }
  }

  /**
   * @param {Map<string, import('./ReactFiber').FiberNode} existingChildren
   * @param {import('./ReactFiber').FiberNode} returnFiber
   * @param {number} newIndex
   * @param {ReturnType<import('react/src/jsx/ReactJSXElement').ReactElement>} newChild
   */
  function updateFromMap(existingChildren, returnFiber, newIndex, newChild) {
    if ((typeof newChild === 'string' && newChild) || typeof newChild === 'number') {
      const matchedFiber = existingChildren.get(newIndex)
      return updateTextNode(returnFiber, matchedFiber, `${newChild}`)
    }
    if (typeof newChild === 'object' && newChild !== null) {
      switch (newChild.$$typeof) {
        case REACT_ELEMENT_TYPE:
          const matchedFiber = existingChildren.get(newChild.key ?? newIndex)
          return updateElement(returnFiber, matchedFiber, newChild)
        default:
          break
      }
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
    let oldFiber = currentFirstChild
    let nextOldFiber = null
    let lastPlacedIndex = 0

    // 处理老节点和新节点前面个数相同的部分
    for (; oldFiber && newIndex < newChildren.length; newIndex++) {
      nextOldFiber = oldFiber.sibling
      const newFiber = updateSlot(returnFiber, oldFiber, newChildren[newIndex])
      if (!newFiber) {
        // 没有可以复用 fiber，结束本轮循环
        break
      }
      if (shouldTrackSideEffects) {
        if (oldFiber && !newFiber.alternate) {
          deleteChild(returnFiber, oldFiber)
        }
      }
      placeChild(newFiber, lastPlacedIndex, newIndex)
      if (!previousNewFiber) {
        resultingFirstChild = newFiber
      } else {
        previousNewFiber.sibling = newFiber
      }
      previousNewFiber = newFiber
      oldFiber = nextOldFiber
    }

    // 如果新的 children 遍历完成，可以移除剩余的老 fiber 了
    if (newIndex === newChildren.length) {
      deleteRemainingChildren(returnFiber, oldFiber)
      return resultingFirstChild
    }

    // 如没有老 fiber 了，新的 fiber 直接插入
    if (!oldFiber) {
      // 若有新增的元素
      for (; newIndex < newChildren.length; newIndex++) {
        const newFiber = createChild(returnFiber, newChildren[newIndex])
        if (!newFiber) continue
        placeChild(newFiber, lastPlacedIndex, newIndex)
        if (!previousNewFiber) {
          resultingFirstChild = newFiber
        } else {
          previousNewFiber.sibling = newFiber
        }
        previousNewFiber = newFiber
      }
    }

    const existingChildren = mapRemainingChildren(returnFiber, oldFiber)

    for (; newIndex < newChildren.length; newIndex++) {
      const newFiber = updateFromMap(existingChildren, returnFiber, newIndex, newChildren[newIndex])
      if (newFiber) {
        if (shouldTrackSideEffects) {
          if (newFiber.alternate) {
            // 这个 newFiber 是复用的节点，移除老的 fiber 缓存
            existingChildren.delete(newFiber.key ?? newIndex)
          }
        }
        lastPlacedIndex = placeChild(newFiber, lastPlacedIndex, newIndex)
        if (!previousNewFiber) {
          resultingFirstChild = newFiber
        } else {
          previousNewFiber.sibling = newFiber
        }
        previousNewFiber = newFiber
      }
    }

    if (shouldTrackSideEffects) {
      existingChildren.forEach(child => deleteChild(returnFiber, child))
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
          // 处理新节点是单节点的情况
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
