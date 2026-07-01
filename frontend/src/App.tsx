// src/App.tsx
import { Navigate, Route, Routes } from 'react-router-dom';
import GlobalView from './components/Views/GlobalView';

function App() {
  return (
    <>
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
          path="/:namespace/projects/:projectId/dashboard"
          element={<GlobalView />}
        />
        <Route
          path="/:namespace/projects/:projectId/roadmap"
          element={<GlobalView />}
        />
        <Route
          path="/:namespace/projects/:projectId/pages/:pageId/document"
          element={<GlobalView />}
        />
        <Route
          path="/:namespace/projects/:projectId/pages/:pageId/kanban"
          element={<GlobalView />}
        />
        <Route
          path="/:namespace/projects/:projectId/pages/:pageId/canvas"
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
    </>
  );
}

export default App;
