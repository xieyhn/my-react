import { createRoot } from 'react-dom/src/client/ReactDOMRoot'
import { useReducer } from 'react/src/index'

function MyComponent() {
  const [number, dispatch] = useReducer(action => {
    switch (action.type) {
      case 'add':
        return number + 1
      default:
        return number
    }
  }, 0)

  return (
    <h1 id="container" onClick={() => dispatch({ type: 'add' })}>
      Hello React <span>{number}</span>
    </h1>
  )
}

const element = <MyComponent />

const root = createRoot(window.document.querySelector('#root'))

root.render(element)
