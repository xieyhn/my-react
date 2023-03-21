import { createRoot } from 'react-dom/src/client/ReactDOMRoot'
import { useReducer, useState, useEffect, useLayoutEffect, useRef } from 'react/src/index'

function MyComponent() {
  const [values, setValues] = useState(new Array(10).fill('A'))
  const buttonRef = useRef()

  useEffect(() => {
    // setValues(v => v.map(n => `${n}B`))
    console.log('buttonRef', buttonRef)
  }, [])

  return (
    <button onClick={() => setValues(v => v.map(n => `${n}C`))} ref={buttonRef}>
      {values.map((n, idx) => (
        <span key={idx}>{n}</span>
      ))}
    </button>
  )
}

const element = <MyComponent />

const root = createRoot(window.document.querySelector('#root'))

root.render(element)
