import { createRoot } from 'react-dom/src/client/ReactDOMRoot'

const element = <h1>Hello <span>lala</span> React</h1>
const root = createRoot(window.document.querySelector('#root'))

console.log(root)