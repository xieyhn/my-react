export const TotalLanes = 31

export const NoLanes = 0b0000000000000000000000000000000
export const NoLane = 0b0000000000000000000000000000000

export const SyncHydrationLane = 0b0000000000000000000000000000001
export const SyncLane = 0b0000000000000000000000000000010

export const InputContinuousHydrationLane = 0b0000000000000000000000000000100
export const InputContinuousLane = 0b0000000000000000000000000001000

export const DefaultHydrationLane = 0b0000000000000000000000000010000
export const DefaultLane = 0b0000000000000000000000000100000

export const SyncUpdateLanes = 0b0000000000000000000000000101010

const TransitionHydrationLane = 0b0000000000000000000000001000000
const TransitionLanes = 0b0000000011111111111111110000000
const TransitionLane1 = 0b0000000000000000000000010000000
const TransitionLane2 = 0b0000000000000000000000100000000
const TransitionLane3 = 0b0000000000000000000001000000000
const TransitionLane4 = 0b0000000000000000000010000000000
const TransitionLane5 = 0b0000000000000000000100000000000
const TransitionLane6 = 0b0000000000000000001000000000000
const TransitionLane7 = 0b0000000000000000010000000000000
const TransitionLane8 = 0b0000000000000000100000000000000
const TransitionLane9 = 0b0000000000000001000000000000000
const TransitionLane10 = 0b0000000000000010000000000000000
const TransitionLane11 = 0b0000000000000100000000000000000
const TransitionLane12 = 0b0000000000001000000000000000000
const TransitionLane13 = 0b0000000000010000000000000000000
const TransitionLane14 = 0b0000000000100000000000000000000
const TransitionLane15 = 0b0000000001000000000000000000000
const TransitionLane16 = 0b0000000010000000000000000000000

const RetryLanes = 0b0000111100000000000000000000000
const RetryLane1 = 0b0000000100000000000000000000000
const RetryLane2 = 0b0000001000000000000000000000000
const RetryLane3 = 0b0000010000000000000000000000000
const RetryLane4 = 0b0000100000000000000000000000000

export const SomeRetryLane = RetryLane1

export const SelectiveHydrationLane = 0b0001000000000000000000000000000

const NonIdleLanes = 0b0001111111111111111111111111111

export const IdleHydrationLane = 0b0010000000000000000000000000000
export const IdleLane = 0b0100000000000000000000000000000

export const OffscreenLane = 0b1000000000000000000000000000000

/**
 * @param {import('./ReactFiberRoot').FiberRootNode} root 
 * @param {*} updateLane 
 */
export function markRootUpdated(root, updateLane) {
  root.pendingLanes |= updateLane
}

/**
 * @param {import('./ReactFiberRoot').FiberRootNode} root 
 */
export function getNextLanes(root) {
  const pendingLanes = root.pendingLanes
  if (pendingLanes === NoLanes) {
    return NoLanes
  }
  const nextLanes = getHighestPriorityLanes(pendingLanes)
  return nextLanes
}

function getHighestPriorityLanes(lanes) {
  return getHighestPriorityLane(lanes)
}

/**
 * 找到优先级最高的车道，即在二进制中找到最右边的一个 1
 */
export function getHighestPriorityLane(lanes) {
  return lanes & -lanes
}

export function includesNonIdleWork(lanes) {
  return (lanes & NonIdleLanes) !== NoLanes
}

export function isSubsetOfLanes(set, subset) {
  return (set & subset) === subset
}

export function mergeLanes(a, b) {
  return a | b
}
