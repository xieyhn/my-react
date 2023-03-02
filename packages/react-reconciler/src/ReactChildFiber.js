import { REACT_ELEMENT_TYPE } from 'shared/ReactSymbols'
import { createFiberFromElement } from './ReactFiber'
import { Placement } from './ReactFiberFlags'

/**
 * @param {boolean} shouldTrackSideEffects
 */
function createChildReconciler(shouldTrackSideEffects) {
  /**
   * @param {import('./ReactFiber').FiberNode} returnFiber
   * @param {import('./ReactFiber').FiberNode} currentFirstFiber
   * @param {*} element
   */
  function reconcileSingleElement(returnFiber, currentFirstFiber, element) {
    // TODO 暂时考虑是初次挂载，直接创建新的 Fiber 节点
    const created = createFiberFromElement(element)
    created.return = returnFiber
    return created
  }

  /**
   *
   * @param {import('./ReactFiber').FiberNode} newFiber
   */
  function placeSingleChild(newFiber) {
    if (shouldTrackSideEffects) {
      newFiber.flags |= Placement
    }
    return newFiber
  }

  /**
   * @param {import('./ReactFiber').FiberNode} returnFiber 父 Fiber
   * @param {import('./ReactFiber').FiberNode} currentFirstFiber current 第一个子 Fiber
   * @param {*} newChild 新的子虚拟 DOM
   */
  function reconcilerChildFibers(returnFiber, currentFirstFiber, newChild) {
    // TODO 暂时只考虑 newChild 是一个节点的情况
    if (typeof newChild === 'object' && newChild !== null) {
      switch (newChild.$$typeof) {
        case REACT_ELEMENT_TYPE:
          return placeSingleChild(reconcileSingleElement(returnFiber, currentFirstFiber, newChild))
        default:
          break
      }
    }
  }
  return reconcilerChildFibers
}

export const mountChildFibers = createChildReconciler(false)
export const reconcileChildFibers = createChildReconciler(true)
