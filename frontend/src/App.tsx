// src/App.tsx
import { GlobalCanvas } from './components/Canvases/GlobalCanvas';
import Sidebar from './components/Sidebar';

function App() {
  return (
    <div className="flex h-screen w-screen overflow-hidden dark:bg-black dark:text-slate-100">
      <aside className="w-64 h-full flex flex-col border-r border-slate-900 bg-slate-800/50 overflow-y-auto p-4">
        <Sidebar />
      </aside>
      <GlobalCanvas />
    </div>
  );
}

export default App;
