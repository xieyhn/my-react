import {
  appendInitialChild,
  createInstance,
  createTextInstance,
  finalizeInitialChildren,
  prepareUpdate
} from 'react-dom-bindings/src/client/ReactDOMHostConfig'
import { NoFlags, Ref, Update } from './ReactFiberFlags'
import { FunctionComponent, HostComponent, HostRoot, HostText } from './ReactWorkTags'

/**
 * 将所有的直接子节点添加在自己身上（后代节点会通过 completeWork 会一层一层往上添加)，因此这里只需要处理直接子节点
 * @param {*} parent
 * @param {import('./ReactFiber').FiberNode} workInProgress
 */
function appendAllChildren(parent, workInProgress) {
  let node = workInProgress.child

  while (node) {
    if (node.tag === HostText || node.tag === HostComponent) {
      // 通过 DOM API 插入节点
      appendInitialChild(parent, node.stateNode)
    } else if (node.child) {
      // 虽不是原生节点，但可能是组件等，继续处理函数组件的 child
      node = node.child
      continue
    }

    // 如果没有兄弟节点，则返回至父节点继续找兄弟节点处理（上面的发生了组件节点向下找的情况，这里需要反回去处理）
    while (!node.sibling) {
      if (node.return === workInProgress) {
        return
      }
      node = node.return
    }

    // 处理兄弟节点
    node = node.sibling
  }
}

/**
 * @param {import('./ReactFiber').FiberNode} workInProgress 
 */
function markUpdate(workInProgress) {
  workInProgress.flags |= Update
}

/**
 * @param {import('./ReactFiber').FiberNode} current 
 * @param {import('./ReactFiber').FiberNode} workInProgress 
 * @param {*} type 
 * @param {*} newProps 
 */
function updateHostComponent(current, workInProgress, type, newProps) {
  const oldProps = current.memoizedProps
  const instance = workInProgress.stateNode
  const updatePayload = prepareUpdate(instance, type, oldProps, newProps)
  workInProgress.updateQueue = updatePayload

  if (updatePayload && updatePayload.length) {
    markUpdate(workInProgress)
  }
}

/**
 * @param {import('./ReactFiber').FiberNode} current
 * @param {import('./ReactFiber').FiberNode} workInProgress
 */
export function completeWork(current, workInProgress) {
  const { type, pendingProps: newProps } = workInProgress

  switch (workInProgress.tag) {
    case HostText:
      // 文本节点的 props 存储的即是字符串
      workInProgress.stateNode = createTextInstance(newProps)
      // 记录 subtreeFlags
      bubbleProperties(workInProgress)
      break
    case HostComponent:
      if (current && workInProgress.stateNode) {
        // update
        updateHostComponent(current, workInProgress, type, newProps)
        if (current.ref && current.ref !== workInProgress.ref) {
          markRef(workInProgress)
        }
      } else {
        // create
        const instance = createInstance(type, newProps, workInProgress)
        workInProgress.stateNode = instance
        // 第一次挂载阶段，直接将子节点挂载自己身上，不用更新啥的
        appendAllChildren(instance, workInProgress)
        finalizeInitialChildren(instance, type, newProps)
        if (workInProgress.ref) {
          markRef(workInProgress)
        }
      }
      bubbleProperties(workInProgress)
      break
    case FunctionComponent:
      bubbleProperties(workInProgress)
      break
    case HostRoot:
      bubbleProperties(workInProgress)
      break
  }
}

/**
 * @param {import('./ReactFiber').FiberNode} completedWork
 */
function bubbleProperties(completedWork) {
  let subtreeFlags = NoFlags
  let child = completedWork.child
  while (child) {
    subtreeFlags |= child.subtreeFlags
    subtreeFlags |= child.flags
    child = child.sibling
  }
  completedWork.subtreeFlags = subtreeFlags
}

function markRef(workInProgress) {
  workInProgress.flags |= Ref
}
