import assign from 'shared/assign'

const MouseEventInterface = {
  clientX: 0,
  clientY: 0
}

function functionThatReturnsTrue() {
  return true
}

function functionThatReturnsFalse() {
  return false
}

function createSyntheticEvent(_interface) {
  function SyntheticBaseEvent(
    reactName,
    reactEventType,
    targetInst,
    nativeEvent,
    nativeEventTarget
  ) {
    this._reactName = reactName
    this._targetInst = targetInst
    this.type = reactEventType
    this.nativeEvent = nativeEvent
    this.target = nativeEventTarget
    this.currentTarget = null

    for (const propName in _interface) {
      if (!_interface.hasOwnProperty(propName)) {
        continue
      }
      this[propName] = nativeEvent[propName]
    }

    // 是否已经阻止默认事件
    this.isDefaultPrevented = functionThatReturnsFalse
    // 是否已经阻止继续传播
    this.isPropagationStopped = functionThatReturnsFalse
  }

  assign(SyntheticBaseEvent.prototype, {
    preventDefault() {
      this.nativeEvent.preventDefault()
      this.isDefaultPrevented = functionThatReturnsTrue
    },
    stopPropagation() {
      this.nativeEvent.stopPropagation()
      this.isPropagationStopped = functionThatReturnsTrue
    }
  })

  return SyntheticBaseEvent
}

export const SyntheticMouseEvent = createSyntheticEvent(MouseEventInterface)
