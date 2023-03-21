import { FunctionComponent, HostComponent, HostRoot, HostText } from './ReactWorkTags'
import { MutationMask, Passive, Placement, Update, LayoutMask, Ref } from './ReactFiberFlags'
import {
  appendChild,
  commitUpdate,
  insertBefore,
  removeChild
} from 'react-dom-bindings/src/client/ReactDOMHostConfig'
import {
  HasEffect as HookHasEffect,
  Passive as HookPassive,
  Layout as HookLayout
} from './ReactHookEffectTags'

/**
 * @type {HTMLElement | null}
 */
let hostParent = null

/**
 * @param {import('./ReactFiberRoot').FiberRootNode} finishedRoot
 * @param {import('./ReactFiber').FiberNode} nearestMountedAncestor
 * @param {import('./ReactFiber').FiberNode} parent
 */
function recursivelyTraverseDeletionEffects(finishedRoot, nearestMountedAncestor, parent) {
  let child = parent.child
  while (child) {
    commitDeletionEffectsOnFiber(finishedRoot, nearestMountedAncestor, child)
    child = child.sibling
  }
}

/**
 * @param {import('./ReactFiberRoot').FiberRootNode} finishedRoot
 * @param {import('./ReactFiber').FiberNode} nearestMountedAncestor
 * @param {import('./ReactFiber').FiberNode} deletedFiber
 */
function commitDeletionEffectsOnFiber(finishedRoot, nearestMountedAncestor, deletedFiber) {
  switch (deletedFiber.tag) {
    case HostComponent:
    case HostText:
      // 递归删除子节点（这里需要一层一层处理子节点的删除逻辑，如和生命周期相关等）
      recursivelyTraverseDeletionEffects(finishedRoot, nearestMountedAncestor, deletedFiber)
      if (hostParent) {
        removeChild(hostParent, deletedFiber.stateNode)
      }
      break
    default:
      break
  }
}

/**
 * @param {import('./ReactFiberRoot').FiberRootNode} root
 * @param {import('./ReactFiber').FiberNode} returnFiber
 * @param {import('./ReactFiber').FiberNode} deletedFiber
 */
function commitDeletionEffects(root, returnFiber, deletedFiber) {
  let parent = returnFiber

  findParent: while (parent) {
    switch (parent.tag) {
      case HostComponent:
        hostParent = parent.stateNode
        break findParent
      case HostRoot:
        hostParent = parent.stateNode.containerInfo
        break findParent
    }
    parent = parent.return
  }

  commitDeletionEffectsOnFiber(root, returnFiber, deletedFiber)
  hostParent = null
}

/**
 * @param {import('./ReactFiberRoot').FiberRootNode} root
 * @param {import('./ReactFiber').FiberNode} parentFiber
 */
function recursivelyTraverseMutationEffects(root, parentFiber) {
  // 处理需要移除的子节点
  const deletions = parentFiber.deletions
  if (deletions) {
    deletions.forEach(child => {
      commitDeletionEffects(root, parentFiber, child)
    })
  }

  if (parentFiber.subtreeFlags & MutationMask) {
    let { child } = parentFiber
    while (child) {
      commitMutationEffectsOnFiber(child, root)
      child = child.sibling
    }
  }
}

/**
 * @param {import('./ReactFiber').FiberNode} fiber
 */
function isHostParent(fiber) {
  return fiber.tag === HostRoot || fiber.tag === HostComponent
}

/**
 * @param {import('./ReactFiber').FiberNode} fiber
 */
function getHostParentFiber(fiber) {
  let parent = fiber.return
  while (parent) {
    if (isHostParent(parent)) {
      return parent
    }
    parent = parent.return
  }
  return null
}

/**
 * @param {import('./ReactFiber').FiberNode} fiber
 * @param {HTMLElement} anchor
 * @param {HTMLElement} parent
 */
function insertOrAppendPlacementNode(fiber, anchor, parent) {
  const isHost = fiber.tag === HostComponent || fiber.tag === HostText

  if (isHost) {
    if (anchor) {
      insertBefore(parent, fiber.stateNode, anchor)
    } else {
      appendChild(parent, fiber.stateNode)
    }
  } else {
    if (fiber.child) {
      insertOrAppendPlacementNode(fiber.child, anchor, parent)
      let { sibling } = fiber.child
      while (sibling) {
        insertOrAppendPlacementNode(sibling, anchor, parent)
        sibling = sibling.sibling
      }
    }
  }
}

/**
 * 找已处于 document 中的后一兄弟节点（hostComponent 和 hostText），且 flags 不是 Placement，因 Placement 是待插入状态，此时还不存在于 document 中
 * @param {import('./ReactFiber').FiberNode} fiber
 */
function getHostSibling(fiber) {
  let node = fiber

  siblings: while (true) {
    // 在此循环中说明还没有找到目标的 DOM 节点
    // 主要是在处理存在组件的情况，如果是一个组件，则需要向下找 child，一直没找到就回退到（向上）该组件，找该组件的下一个兄弟 fiber（向右）
    // 以此类推直到找到目标 fiber 对应的 DOM 节点，或没有符合的 fiber，返回 null，即等同于新增

    // 如果没有兄弟 fiber ，返回上一级父元素（下面的 where 循环会向下找，这里恢复往上找），以便查询父 fiber 的兄弟 fiber
    while (!node.sibling) {
      // 如果没有父 fiber，或父 fiber 就是原生节点或跟节点，说明不可能有目标 anchor 了（说明已经向上找到非组件的 fiber 了）
      if (!node.return || isHostParent(node.return)) {
        return null
      }
      node = node.return
    }

    node = node.sibling

    // 如果 fiber 对应的节点不是 DOM 节点（即是组件），则先判断此组件是否有新增标识，如果此组件有新增标识，说明此组件以及后代都是新增的，因此没有必要再往下找
    // 如果此组件不是新增的，继续向下找 fiber，尝试找到已经存在于文档树中的 fiber（对应的 DOM)
    while (node.tag !== HostComponent && node.tag !== HostText) {
      if (node.flags & Placement) {
        continue siblings
      } else {
        node = node.child
      }
    }

    // 此 fiber 不是新增的，对应的 DOM 存在于 document 中，即是目标
    if (!(node.flags & Placement)) {
      return node.stateNode
    }
  }
}

/**
 * @param {import('./ReactFiber').FiberNode} finishedWork
 */
function commitPlacement(finishedWork) {
  const parentFiber = getHostParentFiber(finishedWork)
  switch (parentFiber.tag) {
    case HostRoot: {
      const parent = parentFiber.stateNode.containerInfo
      const anchor = getHostSibling(finishedWork)
      insertOrAppendPlacementNode(finishedWork, anchor, parent)
      break
    }
    case HostComponent: {
      const parent = parentFiber.stateNode
      const anchor = getHostSibling(finishedWork)
      insertOrAppendPlacementNode(finishedWork, anchor, parent)
      break
    }
    default:
      break
  }
}

/**
 * @param {import('./ReactFiber').FiberNode} finishedWork
 */
function commitReconciliationEffects(finishedWork) {
  const { flags } = finishedWork
  if (flags & Placement) {
    commitPlacement(finishedWork)
    finishedWork.flags &= ~Placement
  }
}

/**
 * @param {import('./ReactFiber').FiberNode} finishedWork
 */
function commitAttachRef(finishedWork) {
  const ref = finishedWork.ref
  if (ref) {
    const instance = finishedWork.stateNode
    if (typeof ref === 'function') {
      ref(instance)
    } else if (typeof ref === 'object') {
      ref.current = instance
    }
  }
}

/**
 * @param {import('./ReactFiber').FiberNode} finishedWork
 * @param {import('./ReactFiberRoot').FiberRootNode} root
 */
export function commitMutationEffectsOnFiber(finishedWork, root) {
  const current = finishedWork.alternate
  const flags = finishedWork.flags

  switch (finishedWork.tag) {
    case HostRoot:
    case HostText: {
      recursivelyTraverseMutationEffects(root, finishedWork)
      commitReconciliationEffects(finishedWork)
      break
    }
    case FunctionComponent: {
      recursivelyTraverseMutationEffects(root, finishedWork)
      commitReconciliationEffects(finishedWork)
      if (flags & Update) {
        commitHookEffectListUnmount(HookHasEffect | HookLayout, finishedWork)
      }
      break
    }
    case HostComponent: {
      recursivelyTraverseMutationEffects(root, finishedWork)
      commitReconciliationEffects(finishedWork)
      if (flags & Ref) {
        commitAttachRef(finishedWork)
      }
      if (flags & Update) {
        const instance = finishedWork.stateNode
        if (instance) {
          const newProps = finishedWork.memoizedProps
          const oldProps = current?.memoizedProps ?? newProps
          const updatePayload = finishedWork.updateQueue
          finishedWork.updateQueue = null
          if (updatePayload) {
            commitUpdate(
              instance,
              updatePayload,
              finishedWork.type,
              oldProps,
              newProps,
              finishedWork
            )
          }
        }
      }
      break
    }
    default:
      break
  }
}

/**
 * @param {{import('./ReactFiber').FiberNode}} parentFiber
 */
function recursivelyTraversePassiveUnmountEffects(parentFiber) {
  if (parentFiber.subtreeFlags & Passive) {
    let child = parentFiber.child
    while (child) {
      commitPassiveUnmountOnFiber(child)
      child = child.sibling
    }
  }
}

function commitHookEffectListUnmount(flags, finishedWork) {
  const updateQueue = finishedWork.updateQueue
  const lastEffect = updateQueue?.lastEffect
  if (lastEffect) {
    const firstEffect = lastEffect.next
    let effect = firstEffect
    do {
      if ((effect.tag & flags) === flags) {
        const destroy = effect.destroy
        if (destroy) {
          destroy()
        }
      }
      effect = effect.next
      // 这是一个循环链表，因此这样做循环退出条件
    } while (effect !== firstEffect)
  }
}

function commitHookPassiveUnmountEffects(finishedWork, hookFlags) {
  commitHookEffectListUnmount(hookFlags, finishedWork)
}

function commitPassiveUnmountOnFiber(finishedWork) {
  const flags = finishedWork.flags
  switch (finishedWork.tag) {
    case HostRoot:
      recursivelyTraversePassiveUnmountEffects(finishedWork)
      break
    case FunctionComponent:
      recursivelyTraversePassiveUnmountEffects(finishedWork)
      if (flags & Passive) {
        commitHookPassiveUnmountEffects(finishedWork, HookPassive | HookHasEffect)
      }
      break
    default:
      break
  }
}

export function commitPassiveUnmountEffect(finishedWork) {
  commitPassiveUnmountOnFiber(finishedWork)
}

/**
 * @param {import('./ReactFiberRoot').FiberRootNode} root
 * @param {{import('./ReactFiber').FiberNode}} parentFiber
 */
function recursivelyTraversePassiveMountEffects(root, parentFiber) {
  if (parentFiber.subtreeFlags & Passive) {
    let child = parentFiber.child
    while (child) {
      commitPassiveMountOnFiber(root, child)
      child = child.sibling
    }
  }
}

/**
 * @param {number} flags
 * @param {import('./ReactFiber').FiberNode} finishedWork
 */
function commitHookEffectListMount(flags, finishedWork) {
  const updateQueue = finishedWork.updateQueue
  const lastEffect = updateQueue?.lastEffect
  if (lastEffect) {
    const firstEffect = lastEffect.next
    let effect = firstEffect
    do {
      if ((effect.tag & flags) === flags) {
        const create = effect.create
        effect.destroy = create()
      }
      effect = effect.next
      // 这是一个循环链表，因此这样做循环退出条件
    } while (effect !== firstEffect)
  }
}

/**
 * @param {import('./ReactFiber').FiberNode} finishedWork
 * @param {number} hookFlags
 */
function commitHookPassiveMountEffects(finishedWork, hookFlags) {
  commitHookEffectListMount(hookFlags, finishedWork)
}

/**
 * @param {import('./ReactFiberRoot').FiberRootNode} finishedRoot
 * @param {import('./ReactFiber').FiberNode} finishedWork
 */
function commitPassiveMountOnFiber(finishedRoot, finishedWork) {
  const flags = finishedWork.flags
  switch (finishedWork.tag) {
    case HostRoot:
      recursivelyTraversePassiveMountEffects(finishedRoot, finishedWork)
      break
    case FunctionComponent:
      recursivelyTraversePassiveMountEffects(finishedRoot, finishedWork)
      if (flags & Passive) {
        commitHookPassiveMountEffects(finishedWork, HookPassive | HookHasEffect)
      }
      break
    default:
      break
  }
}

/**
 * @param {import('./ReactFiberRoot').FiberRootNode} root
 * @param {import('./ReactFiber').FiberNode} finishedWork
 */
export function commitPassiveMountEffect(root, finishedWork) {
  commitPassiveMountOnFiber(root, finishedWork)
}

/**
 * @param {import('./ReactFiberRoot').FiberRootNode} root
 * @param {{import('./ReactFiber').FiberNode}} parentFiber
 */
function recursivelyTraverseLayoutMountEffects(root, parentFiber) {
  if (parentFiber.subtreeFlags & LayoutMask) {
    let child = parentFiber.child
    while (child) {
      const current = child.alternate
      commitLayoutEffectOnFiber(root, current, child)
      child = child.sibling
    }
  }
}

/**
 *
 * @param {import('./ReactFiber').FiberNode} finishedWork
 * @param {number} hookFlags
 */
function commitHookLayoutEffects(finishedWork, hookFlags) {
  commitHookEffectListMount(hookFlags, finishedWork)
}

/**
 * @param {import('./ReactFiberRoot').FiberRootNode} finishedRoot
 * @param {import('./ReactFiber').FiberNode} current
 * @param {import('./ReactFiber').FiberNode} finishedWork
 */
function commitLayoutEffectOnFiber(finishedRoot, current, finishedWork) {
  const flags = finishedWork.flags
  switch (finishedWork.tag) {
    case HostRoot:
      recursivelyTraverseLayoutMountEffects(finishedRoot, finishedWork)
      break
    case FunctionComponent:
      recursivelyTraverseLayoutMountEffects(finishedRoot, finishedWork)
      if (flags & LayoutMask) {
        commitHookLayoutEffects(finishedWork, HookLayout | HookHasEffect)
      }
      break
    default:
      break
  }
}

/**
 * @param {import('./ReactFiber').FiberNode} finishedWork
 * @param {import('./ReactFiberRoot').FiberRootNode} root
 */
export function commitLayoutEffects(finishedWork, root) {
  const current = finishedWork.alternate
  commitLayoutEffectOnFiber(root, current, finishedWork)
}
