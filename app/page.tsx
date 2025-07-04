import Link from 'next/link'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 w-full max-w-5xl items-center justify-center font-mono text-sm flex">
        <h1 className="text-4xl font-bold text-center mb-8">
          MARS Next - Multi-Agent Recursive System
        </h1>
      </div>
      
      <div className="flex flex-col items-center gap-4 mt-8">
        <p className="text-xl text-center max-w-2xl">
          A next-generation platform for multi-agent AI collaboration and synthesis
        </p>
        
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 border rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <h2 className="text-2xl font-semibold mb-3">Recursive Intelligence</h2>
            <p>One input, many minds, one coherent output signal through our synthesis architecture.</p>
          </div>
          
          <div className="p-6 border rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <h2 className="text-2xl font-semibold mb-3">Agent Modularity</h2>
            <p>Build your AI team with specialized agents acting as tools, not characters.</p>
          </div>
          
          <div className="p-6 border rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <h2 className="text-2xl font-semibold mb-3">Context Mastery</h2>
            <p>Seamlessly digest documents into structured markdown for optimal agent consumption.</p>
          </div>
          
          <div className="p-6 border rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <h2 className="text-2xl font-semibold mb-3">Speed-First Design</h2>
            <p>All agent actions run concurrently with intelligent caching for maximum efficiency.</p>
          </div>
        </div>
        
        <div className="mt-10">
          <Link 
            href="/projects" 
            className="px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Get Started
          </Link>
        </div>
      </div>
    </main>
  )
} 