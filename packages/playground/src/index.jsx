import { createRoot } from 'react-dom/src/client/ReactDOMRoot'
import { useReducer, useState } from 'react/src/index'

function MyComponent() {
  const [flag, setFlag] = useState(true)

  return flag ? (
    <ul key="container" onClick={() => setFlag(false)}>
      <li key="A">A</li>
      <li key="B">B</li>
      <li key="C">C</li>
    </ul>
  ) : (
    <ul key="container">
      <li key="B">B</li>
    </ul>
  )
}

/**
 * 多节点 DIFF
 */
function MyComponent2() {
  const [flag, setFlag] = useState(true)

  return flag ? (
    <ul key="container" onClick={() => setFlag(false)}>
      <li key="A" id="a1">
        A1
      </li>
      <li key="B" id="b1">
        B1
      </li>
      <li key="C" id="c1">
        C1
      </li>
    </ul>
  ) : (
    <ul key="container">
      <li key="A" id="a2">
        A2
      </li>
      <p key="B" id="b2">
        B2
      </p>
      <li key="C" id="c2">
        C2
      </li>
    </ul>
  )
}

/**
 * 多节点 diff，老的不变，新增一个元素
 * @returns
 */
function MyComponent3() {
  const [flag, setFlag] = useState(true)

  return flag ? (
    <ul key="container" onClick={() => setFlag(false)}>
      <li key="A" id="a1">
        A1
      </li>
      <li key="B" id="b1">
        B1
      </li>
      <li key="C" id="c1">
        C1
      </li>
    </ul>
  ) : (
    <ul key="container">
      <li key="A" id="a1">
        A1
      </li>
      <li key="B" id="b1">
        B1
      </li>
      <li key="C" id="c1">
        C1
      </li>
      <li key="D" id="c1">
        D1
      </li>
    </ul>
  )
}

/**
 * 多节点 diff，删除一个元素
 * @returns
 */
function MyComponent4() {
  const [flag, setFlag] = useState(true)

  return flag ? (
    <ul key="container" onClick={() => setFlag(false)}>
      <li key="A" id="a1">
        A1
      </li>
      <li key="B" id="b1">
        B1
      </li>
      <li key="C" id="c1">
        C1
      </li>
    </ul>
  ) : (
    <ul key="container">
      <li key="A" id="a1">
        A1
      </li>
      <li key="B" id="b1">
        B1
      </li>
    </ul>
  )
}

function MyComponent5() {
  const [flag, setFlag] = useState(true)

  return flag ? (
    <ul onClick={() => setFlag(false)}>
      <li key="A">A</li>
      <li key="B">B</li>
      <li key="C">C</li>
      <li key="D">D</li>
      <li key="E">E</li>
      <li key="F">F</li>
    </ul>
  ) : (
    <ul>
      <li key="A">A2</li>
      <li key="C">C2</li>
      <li key="E">E2</li>
      <li key="B">B2</li>
      <li key="G">G2</li>
      <li key="D">D2</li>
    </ul>
  )
}

const element = <MyComponent5 />

const root = createRoot(window.document.querySelector('#root'))

root.render(element)
