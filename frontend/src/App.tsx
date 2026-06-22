// src/App.tsx
import { EditorCanvas } from './components/EditorCanvas';
import Sidebar from './components/Sidebar';

function App() {
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
