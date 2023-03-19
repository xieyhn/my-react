import { createRoot } from 'react-dom/src/client/ReactDOMRoot'
import { useReducer, useState, useEffect, useLayoutEffect } from 'react/src/index'

function MyComponent() {
  console.log('MyComponent')
  const [number, setNumber] = useState(0)

  useEffect(() => {
    setNumber(n => n + 1)
  }, [])

  return (
    <button onClick={() => setNumber(n => n + 1)}>{number}</button>
  )
}

const element = <MyComponent />

const root = createRoot(window.document.querySelector('#root'))

root.render(element)
