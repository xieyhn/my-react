import { createRoot } from 'react-dom/src/client/ReactDOMRoot'
import { useReducer, useState } from 'react/src/index'

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
  const [number2, setNumber2] = useState(100)

  const handleClick1 = () => {
    // dispatch1({ type: 'add' })
    setNumber2(number2 + 1)
  }

  return (
    <button onClick={handleClick1}>
      <span {...attrs}>{number2}</span>
    </button>
  )
}

const element = <MyComponent />

const root = createRoot(window.document.querySelector('#root'))

root.render(element)
