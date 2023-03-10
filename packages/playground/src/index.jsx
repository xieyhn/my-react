import { createRoot } from 'react-dom/src/client/ReactDOMRoot'
import { useReducer, useState } from 'react/src/index'

function MyComponent() {
  const [flag, setFlag] = useState(true)

  return flag ? (
    <ul key="container" onClick={() => setFlag(false)}>
      <li key="A">A</li>
      <li key="B">B</li>
      <li key="C">C</li>
    </ul>
  ) : (
    <ul key="container">
      <li key="B">B</li>
    </ul>
  )
}

const element = <MyComponent />

const root = createRoot(window.document.querySelector('#root'))

root.render(element)
