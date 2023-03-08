import { createRoot } from 'react-dom/src/client/ReactDOMRoot'
import { useReducer } from 'react/src/index'

const reducer = (n, action) => {
  switch (action.type) {
    case 'add':
      return n + 1
    default:
      return n
  }
}

let flag = false

function MyComponent() {
  const attrs = { foo: 'bar', style: { color: 'red', fontSize: 24 } }
  if (flag) {
    delete attrs.foo
    attrs.style = { color: 'blue' }
  }
  flag = true
  const [number1, dispatch1] = useReducer(reducer, 1)

  const handleClick1 = () => {
    debugger
    dispatch1({ type: 'add' })
  }

  return (
    <button onClick={handleClick1}>
      <span {...attrs}>{ number1 }</span>
    </button>
  )
}

const element = <MyComponent />

const root = createRoot(window.document.querySelector('#root'))

root.render(element)
