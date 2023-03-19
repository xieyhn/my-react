import { createRoot } from 'react-dom/src/client/ReactDOMRoot'
import { useReducer, useState, useEffect, useLayoutEffect } from 'react/src/index'

function MyComponent() {
  const [values, setValues] = useState(new Array(10).fill('A'))

  useEffect(() => {
    setValues(v => v.map(n => `${n}B`))
  }, [])

  return (
    <button onClick={() => setValues(v => v.map(n => `${n}C`))}>
      {values.map((n, idx) => (
        <span key={idx}>{n}</span>
      ))}
    </button>
  )
}

const element = <MyComponent />

const root = createRoot(window.document.querySelector('#root'))

root.render(element)
