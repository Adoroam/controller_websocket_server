import { cursorTo } from 'node:readline'

export type Options = {
  question: string
  options: string[]
  color?: string
}
type Select = (opts: Options, callback: Function) => void

const { stdin, stdout } = process
const default_options: Options = {
  question: '',
  options: [],
  color: 'blue',
}
const colorfn = (str, colorName = 'yellow') => {
  const colors = {
    reset: 89,
    yellow: 33,
    blue: 34,
    green: 32,
    cyan: 35,
    red: 31,
    magenta: 36,
  }
  const start = `\x1b[${colors[colorName]}m`
  const stop = `\x1b[${colors.reset}m\x1b[0m`
  return start + str + stop
}
const cursor = {
  show: '\x1B[?25h',
  hide: '\x1B[?25l',
}

const select: Select = async (opts = default_options, callback) => {
  try {
    let { question, options, color } = opts
    if (!question.length) throw new Error("There must be a 'question'")
    if (!options.length) throw new Error("There must be 'options'")
    let selected = 0
  
    const pn = (c) => {
      switch (c) {
        case '\u0004': // Ctrl-d
        case '\r':
        case '\n':
          return enter()
        case '\u0003': // Ctrl-c
          return ctrlc()
        case '\u001b[A':
          return upArrow()
        case '\u001b[B':
          return downArrow()
      }
    }
    const list_opts = () => {
      cursorTo(stdout, 0, 1)
      options.forEach((opt, i) => {
        i === selected
          ? stdout.write(colorfn(`> ${opt}`, color) + '\n')
          : stdout.write(`> ${opt}\n`)
      })
    }
  
    const ctrlc = () => {
      stdin.removeListener('data', pn)
      stdin.setRawMode(false)
      stdin.pause()
      stdout.write(cursor.show)
    }
  
    const enter = () => {
      ctrlc()
      console.clear()
      callback(options[selected])
    }
  
    const upArrow = () => {
      selected = !selected ? options.length - 1 : selected - 1
      list_opts()
    }
    const downArrow = () => {
      selected = selected === options.length - 1 ? 0 : selected + 1
      list_opts()
    }
  
    console.clear()
    stdout.write(question + '\n')
    list_opts()
  
    stdin.setRawMode(true)
    stdin.resume()
    stdin.setEncoding('utf-8')
    stdout.write(cursor.hide)
    stdin.on('data', pn)
  } catch (error) {
    console.error(error)
  }
}

export default select
