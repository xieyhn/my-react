import { createRoot } from 'react-dom/src/client/ReactDOMRoot'
import { useReducer, useState, useEffect } from 'react/src/index'

function MyComponent() {
  const [flag, setFlag] = useState(true)

  useEffect(() => {
    console.log('my useEffect')

    return () => {
      console.log('my useEffect destroy callback')
    }
  })

  useEffect(() => {
    console.log('my useEffect2')

    return () => {
      console.log('my useEffect2 destroy callback')
    }
  })

  return flag ? <h1 onClick={() => setFlag(false)}>Hello Effect</h1> : <h1>New Hello Effect</h1>
}

const element = <MyComponent />

const root = createRoot(window.document.querySelector('#root'))

root.render(element)
