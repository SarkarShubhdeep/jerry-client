const FRAMES = ['-', '\\', '|', '/'] as const

export class Spinner {
  private interval: ReturnType<typeof setInterval> | undefined
  private frameIndex = 0
  private label = ''
  private readonly tty = Boolean(process.stderr.isTTY)

  start(label: string): void {
    this.label = label
    if (!this.tty) {
      process.stderr.write(`jerry: ${label}\n`)
      return
    }
    this.render()
    this.interval = setInterval(() => {
      this.frameIndex = (this.frameIndex + 1) % FRAMES.length
      this.render()
    }, 90)
  }

  update(label: string): void {
    this.label = label
    if (!this.tty) {
      process.stderr.write(`jerry: ${label}\n`)
    }
  }

  stop(finalMessage?: string): void {
    if (this.interval) {
      clearInterval(this.interval)
      this.interval = undefined
    }
    if (this.tty) {
      process.stderr.write('\r\x1b[2K')
    }
    if (finalMessage) {
      process.stderr.write(`jerry: ${finalMessage}\n`)
    }
  }

  private render(): void {
    const frame = FRAMES[this.frameIndex]
    process.stderr.write(`\r\x1b[2Kjerry: ${frame} ${this.label}`)
  }
}
