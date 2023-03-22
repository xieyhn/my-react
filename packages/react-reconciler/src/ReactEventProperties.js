import {
  DefaultLane,
  getHighestPriorityLane,
  IdleLane,
  includesNonIdleWork,
  InputContinuousLane,
  NoLane,
  SyncLane
} from './ReactFiberLane'

let currentUpdatePriority = NoLane

// 离散事件优先级，click onchange
export const DiscreteEventPriority = SyncLane
// 连续事件的优先级，onmousemove
export const ContinuousEventPriority = InputContinuousLane
// 空闲事件优先级
export const IdleEventPriority = IdleLane
export const DefaultEventPriority = DefaultLane

export function getCurrentUpdatePriority() {
  return currentUpdatePriority
}

export function setCurrentUpdatePriority(newPriority) {
  currentUpdatePriority = newPriority
}

export function isHigherEventPriority(a, b) {
  return a !== 0 && a < b
}

export function lanesToEventPriority(lanes) {
  let lane = getHighestPriorityLane(lanes)

  if (!isHigherEventPriority(DiscreteEventPriority, lane)) {
    return DiscreteEventPriority
  }

  if (!isHigherEventPriority(ContinuousEventPriority, lane)) {
    return ContinuousEventPriority
  }

  if (includesNonIdleWork(lane)) {
    return DefaultEventPriority
  }

  return IdleEventPriority
}
