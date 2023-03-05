import { createRoot } from 'react-dom/src/client/ReactDOMRoot'

// const element = (
//   <h1 id="container">
//     Hello <span style={{ color: 'red' }}>red</span> React
//   </h1>
// )

function MyComponent() {
  return (
    <h1
      id="container"
      onClick={(event) => console.log('父冒泡', event)}
      onClickCapture={(event) => console.log('父捕获', event)}
    >
      Hello{' '}
      <span
        style={{ color: 'red' }}
        onClick={(event) => console.log('子冒泡', event)}
        onClickCapture={(event) => console.log('子捕获', event)}
      >
        red
      </span>{' '}
      React
    </h1>
  )
}

const element = <MyComponent />

const root = createRoot(window.document.querySelector('#root'))

root.render(element)
