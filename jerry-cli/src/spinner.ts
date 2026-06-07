const FRAMES = ['-', '\\', '|', '/'] as const

const encoder = new TextEncoder()

export class Spinner {
  private interval: ReturnType<typeof setInterval> | undefined
  private frameIndex = 0
  private label = ''
  private readonly tty = Deno.stderr.isTerminal()

  start(label: string): void {
    this.label = label
    if (!this.tty) {
      Deno.stderr.writeSync(encoder.encode(`jerry: ${label}\n`))
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
      Deno.stderr.writeSync(encoder.encode(`jerry: ${label}\n`))
    }
  }

  /** Permanent stderr line when a phase finishes (spinner keeps running). */
  markStep(label: string): void {
    if (this.tty && this.interval) {
      Deno.stderr.writeSync(encoder.encode(`\r\x1b[2Kjerry: ✓ ${label}\n`))
    } else if (!this.tty) {
      Deno.stderr.writeSync(encoder.encode(`jerry: ✓ ${label}\n`))
    }
  }

  /** Pause spinner for interactive prompts; call `resume` after. */
  pause(): void {
    if (this.interval) {
      clearInterval(this.interval)
      this.interval = undefined
    }
    if (this.tty) {
      Deno.stderr.writeSync(encoder.encode('\r\x1b[2K'))
    }
  }

  resume(label?: string): void {
    if (label) {
      this.label = label
    }
    if (!this.tty) {
      if (label) {
        Deno.stderr.writeSync(encoder.encode(`jerry: ${label}\n`))
      }
      return
    }
    if (!this.interval) {
      this.render()
      this.interval = setInterval(() => {
        this.frameIndex = (this.frameIndex + 1) % FRAMES.length
        this.render()
      }, 90)
    }
  }

  stop(finalMessage?: string): void {
    if (this.interval) {
      clearInterval(this.interval)
      this.interval = undefined
    }
    if (this.tty) {
      Deno.stderr.writeSync(encoder.encode('\r\x1b[2K'))
    }
    if (finalMessage) {
      Deno.stderr.writeSync(encoder.encode(`jerry: ${finalMessage}\n`))
    }
  }

  private render(): void {
    const frame = FRAMES[this.frameIndex]
    Deno.stderr.writeSync(encoder.encode(`\r\x1b[2Kjerry: ${frame} ${this.label}`))
  }
}
