// src/App.tsx
import { Navigate, Route, Routes } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import GlobalView from './components/Views/GlobalView';
import { WorkspaceViewMode } from './state/types';
import { useProjectStore } from './state/useProjectStore';

function App() {
  // 🎯 Single source of truth check for setting global overflow parameters
  const activeViewMode = useProjectStore((state) => state.activeViewMode);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-zinc-950 text-slate-100">
      <aside className="w-64 h-full border-r border-slate-800/60 bg-zinc-900 shrink-0">
        <Sidebar />
      </aside>

      <div
        className={`flex-1 h-full custom-scrollbar ${
          activeViewMode === WorkspaceViewMode.PageDocument
            ? 'overflow-y-auto'
            : 'overflow-hidden'
        }`}
      >
        {/* 🎯 Define the routing map right here */}
        <Routes>
          {/* Default landing: redirect straight to your personal workspace */}
          <Route path="/" element={<Navigate to="/ADParris" replace />} />

          {/* This route catches namespaces, project IDs, AND page IDs all under one roof */}
          <Route path="/:namespace" element={<GlobalView />} />
          <Route
            path="/:namespace/projects/:projectId"
            element={<GlobalView />}
          />
          <Route
            path="/:namespace/projects/:projectId/pages/:pageId"
            element={<GlobalView />}
          />

          {/* Catch-all fallback */}
          <Route
            path="*"
            element={
              <div className="flex items-center justify-center h-full text-slate-500 text-xs">
                Route not found.
              </div>
            }
          />
        </Routes>
      </div>
    </div>
  );
}

export default App;
