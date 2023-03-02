import { HostRoot } from './ReactWorkTags'

/**
 * @param {import('./ReactFiber').FiberNode} sourceFiber 
 */
export function markUpdateLaneFromFiberToRoot(sourceFiber) {
  let node = sourceFiber
  let parent = node.return

  while(parent) {
    node = parent
    parent = node.return
  }

  if (node.tag === HostRoot) {
    return node.stateNode
  }

  return null
}
