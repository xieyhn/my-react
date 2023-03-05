import { createRoot } from 'react-dom/src/client/ReactDOMRoot'

const element = (
  <h1 id="container">
    Hello <span style={{ color: 'red' }}>lala</span> React
  </h1>
)
const root = createRoot(window.document.querySelector('#root'))

root.render(element)
