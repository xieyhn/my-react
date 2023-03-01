import { createFiberRoot } from './ReactFiberRoot'

/**
 * @param {HTMLElement} container
 */
export function createContainer(containerInfo) {
  return createFiberRoot(containerInfo)
}
