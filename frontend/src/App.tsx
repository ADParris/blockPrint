// src/App.tsx
import { EditorCanvas } from './components/EditorCanvas';
import Sidebar from './components/Sidebar';
import useCanvasStore from './state/useCanvasStore';

function App() {
  const isLoading = useCanvasStore((state) => state.isLoading);

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-zinc-950 text-zinc-400">
        <div className="text-lg font-medium animate-pulse">
          Loading blocks...
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden dark:bg-black dark:text-slate-100">
      <aside className="w-64 h-full flex flex-col border-r border-slate-900 bg-slate-800/50 overflow-y-auto p-4">
        <Sidebar />
      </aside>

      <main className="flex-1 h-full overflow-y-auto px-8 py-12 bg-slate-900/50">
        <EditorCanvas />
      </main>
    </div>
  );
}

export default App;
