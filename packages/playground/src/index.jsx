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

function MyComponent() {
  const [number1, dispatch1] = useReducer(reducer, 1)
  const [number2, dispatch2] = useReducer(reducer, 100)

  const handleClick1 = () => {
    dispatch1({ type: 'add' })
    dispatch1({ type: 'add' })
    dispatch1({ type: 'add' })
  }

  const handleClick2 = () => {
    dispatch2({ type: 'add' })
    dispatch2({ type: 'add' })
    dispatch2({ type: 'add' })
  }

  return (
    <h1 id="container">
      <span>{number1}</span>
      <br />
      <span>{number2}</span>
      <br />
      <button onClick={handleClick1}>点击操作 number1</button>
      <button onClick={handleClick2}>点击操作 number2</button>
    </h1>
  )
}

const element = <MyComponent />

const root = createRoot(window.document.querySelector('#root'))

root.render(element)
