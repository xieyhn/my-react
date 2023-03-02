// 为什么使用 for ?
// 我遇到的问题：在 babel 工具进行 jsx 转义时，会将 runtime 构建为一个 js 文件，因此将此文件会生 bundle
// 导致与在客户端上跑的文件不同，如不使用 .for 则会创建出两个不同的 Symbol 对象
export const REACT_ELEMENT_TYPE = Symbol.for('my-react.element')
