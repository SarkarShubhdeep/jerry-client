import readline from 'readline'

export function promptLine(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close()
      resolve(answer.trim())
    })
  })
}

/** Hidden stdin prompt for secrets (no echo). */
export function promptSecret(question: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const stdin = process.stdin
    const stdout = process.stdout

    if (!stdin.isTTY) {
      reject(new Error('Cannot prompt for a secret when stdin is not a TTY'))
      return
    }

    stdout.write(question)
    stdin.resume()
    stdin.setRawMode(true)
    stdin.setEncoding('utf8')

    let value = ''

    const cleanup = (): void => {
      stdin.setRawMode(false)
      stdin.pause()
      stdin.removeListener('data', onData)
      stdout.write('\n')
    }

    const onData = (chunk: string): void => {
      const char = chunk

      if (char === '\u0003') {
        cleanup()
        process.exit(130)
      }

      if (char === '\r' || char === '\n' || char === '\u0004') {
        cleanup()
        resolve(value.trim())
        return
      }

      if (char === '\u007f' || char === '\b') {
        value = value.slice(0, -1)
        return
      }

      value += char
    }

    stdin.on('data', onData)
  })
}
