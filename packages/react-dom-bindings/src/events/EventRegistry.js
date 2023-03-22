export const allNativeEvents = new Set()

/**
 * @param {string} registrationName
 * @param {string[]} dependencies
 */
export function registerTwoPhaseEvent(registrationName, dependencies) {
  registerDirectEvent(registrationName, dependencies)
  registerDirectEvent(registrationName + 'Capture', dependencies)
}

/**
 * @param {string} registrationName
 * @param {string[]} dependencies
 */
function registerDirectEvent(registrationName, dependencies) {
  for (let i = 0; i < dependencies.length; i++) {
    allNativeEvents.add(dependencies[i])
  }
}
