/**
 * 最小堆实现，使用数组存储
 * 最小堆中，每左右两个子节点的值都比父节点大
 */

/**
 * @param {any[]} heap
 * @param {*} node
 */
export function push(heap, node) {
  heap.push(node)
  siftUp(heap, node, heap.length - 1)
}

/**
 * 取堆顶
 * @param {any[]} heap
 */
export function pop(heap) {
  const first = heap[0]
  if (first != undefined) {
    const last = heap.pop()
    if (last !== first) {
      heap[0] = last
      siftDown(heap, last, 0)
      return first
    }
  }
  return null
}

/**
 * 返回堆顶
 * @param {any[]} heap
 */
export function peek(heap) {
  return heap[0] ?? null
}

/**
 * @param {any[]} heap
 * @param {*} node
 * @param {number} i
 */
function siftUp(heap, node, i) {
  let index = i

  while (true) {
    const parentIndex = (index - 1) >>> 2
    const parent = heap[parentIndex]

    if (parent !== undefined && compare(parent, node) > 0) {
      heap[parentIndex] = node
      heap[index] = parent
      index = parentIndex
    } else {
      return
    }
  }
}

/**
 * @param {any[]} heap
 * @param {*} node
 * @param {number} i
 */
function siftDown(heap, node, i) {
  let index = i
  const length = heap.length

  while (index < length) {
    const leftIndex = index * 2 + 1
    const rightIndex = leftIndex + 1
    const left = heap[leftIndex]
    const right = heap[rightIndex]

    if (left !== undefined && compare(left, node) < 0) {
      if (right !== undefined && compare(right, left) < 0) {
        heap[index] = right
        heap[rightIndex] = node
        index = rightIndex
        break
      } else {
        heap[index] = left
        heap[leftIndex] = node
        index = leftIndex
      }
    } else if (right !== undefined && compare(right, node) < 0) {
      heap[index] = right
      heap[rightIndex] = node
      index = rightIndex
    } else {
      return
    }
  }
}

function compare(a, b) {
  const diff = a.sortIndex - b.sortIndex
  return diff !== 0 ? diff : a.id - b.id
}
