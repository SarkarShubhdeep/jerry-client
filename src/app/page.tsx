import { Sparkles } from 'lucide-react'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
      <div className="flex items-center gap-2">
        <Sparkles className="size-6 text-muted-foreground" aria-hidden="true" />
        <h1 className="text-2xl font-semibold tracking-tight">Jerry</h1>
      </div>
      <p className="text-muted-foreground text-center text-sm">Work narrative assistant</p>
      <p className="text-muted-foreground text-center text-xs">Electron + Next.js shell ready</p>
    </main>
  )
}
