'use client'

import Header from '@/components/Header'
import Sidebar from '@/components/Sidebar'
import WorkflowCanvas from '@/components/WorkflowCanvas'
import PropertiesPanel from '@/components/PropertiesPanel'

export default function Home() {
  return (
    <div className="h-screen flex flex-col bg-zinc-950">
      <Header />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        
        <main className="flex-1 relative">
          <WorkflowCanvas />
        </main>
        
        <PropertiesPanel />
      </div>
    </div>
  )
}