import { createRoot } from 'react-dom/src/client/ReactDOMRoot'

// const element = (
//   <h1 id="container">
//     Hello <span style={{ color: 'red' }}>red</span> React
//   </h1>
// )

function MyComponent() {
  return (
    <h1 id="container">
      Hello <span style={{ color: 'red' }}>red</span> React
    </h1>
  )
}

const element = <MyComponent />

const root = createRoot(window.document.querySelector('#root'))

root.render(element)
