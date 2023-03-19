import { createRoot } from 'react-dom/src/client/ReactDOMRoot'
import { useReducer, useState, useEffect, useLayoutEffect } from 'react/src/index'

const element = <h1>Hello</h1>

const root = createRoot(window.document.querySelector('#root'))

root.render(element)
