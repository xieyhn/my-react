export function initialUpdateQueue(fiber) {
  const queue = {
    shared: {
      padding: null
    }
  }
  fiber.updateQueue = queue
}
