// src/App.tsx
import { GlobalCanvas } from './components/Canvases/GlobalCanvas';
import Sidebar from './components/Sidebar';
import { LayoutMode } from './state/types';
import { useCanvasStore } from './state/useCanvasStore';

function App() {
  const notebook = useCanvasStore((state) => state.getActiveNotebook());
  const layoutMode = notebook?.layoutMode ?? LayoutMode.DocumentCanvas;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-zinc-950 text-slate-100">
      <aside className="w-64 h-full border-r border-slate-800/60 bg-zinc-900 shrink-0">
        <Sidebar />
      </aside>

      {/* 🎯 Dynamically toggle scrolling layout context based on the view mode */}
      <div
        className={`flex-1 h-full custom-scrollbar ${
          layoutMode === LayoutMode.DocumentCanvas
            ? 'overflow-y-auto'
            : 'overflow-hidden'
        }`}
      >
        <GlobalCanvas />
      </div>
    </div>
  );
}

export default App;
