module.exports = {
  // 一行超出 100 个字符开始换行
  printWidth: 100,
  // 使用空格代替缩进制表符
  useTabs: false,
  // 缩进 2
  tabWidth: 2,
  // 不分号
  semi: false,
  // 单引号
  singleQuote: true,
  // 对象属性只在需要加引号的时候加
  quoteProps: 'as-needed',
  // 不使用尾逗号
  trailingComma: 'none',
  // { foo: bar }, not {foo: bar}
  bracketSpacing: true,
  // 开始标签的 > 另起一行
  bracketSameLine: false,
  // 箭头函数在一个参数时候省略括号
  arrowParens: 'avoid',
  // 格式化时忽略标签内部的空格
  htmlWhitespaceSensitivity: 'ignore'
}
