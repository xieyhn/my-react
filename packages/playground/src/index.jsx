import { createRoot } from 'react-dom/src/client/ReactDOMRoot'
import { useReducer, useState, useEffect, useLayoutEffect } from 'react/src/index'

function MyComponent() {
  const [flag, setFlag] = useState(true)

  useEffect(() => {
    console.log('my useEffect1')

    return () => {
      console.log('my useEffect1 destroy callback')
    }
  })

  useLayoutEffect(() => {
    console.log('my useLayoutEffect2')

    return () => {
      console.log('my useLayoutEffect2 destroy callback')
    }
  })

  useEffect(() => {
    console.log('my useEffect3')

    return () => {
      console.log('my useEffect3 destroy callback')
    }
  }, [])

  return flag ? <h1 onClick={() => setFlag(false)}>Hello Effect</h1> : <h1>New Hello Effect</h1>
}

const element = <MyComponent />

const root = createRoot(window.document.querySelector('#root'))

root.render(element)
