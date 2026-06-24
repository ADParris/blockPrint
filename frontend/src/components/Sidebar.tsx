import { useState } from 'react';
import { LuPlus } from 'react-icons/lu';
import { useCanvasStore } from '../state/useCanvasStore';
import Modal from './Modal'; // Import your reusable Modal
import { SidebarLayoutToggle } from './SidebarLayoutToggle';
import SortableList from './SortableList';

const Sidebar = () => {
  const {
    activeNotebookId,
    createNotebook,
    getNotebookTitles,
    setActiveNotebookId,
    moveNotebookToIndex,
    deleteNotebook,
  } = useCanvasStore((state) => state);

  const notebookTitles = getNotebookTitles();

  // 💡 Local state to track which menu is open and where it should be positioned
  const [activeMenu, setActiveMenu] = useState<{
    notebookId: string;
    position: { top: number; left: number };
  } | null>(null);

  const handleMenuClick = (e: React.MouseEvent, notebookId: string) => {
    e.stopPropagation(); // 🛑 Stop from selecting the notebook row

    // If clicking the same menu button twice, close it
    if (activeMenu?.notebookId === notebookId) {
      setActiveMenu(null);
      return;
    }

    // Grab the bounding coordinates of the three-dots button to align the menu perfectly
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setActiveMenu({
      notebookId,
      position: {
        top: window.scrollY + rect.bottom + 6, // Place it slightly below the button
        left: window.scrollX + rect.left - 120, // Shift left so it floats nicely inside the sidebar boundary
      },
    });
  };

  return (
    <>
      {/* App Brand Header */}
      <div className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-6 px-2">
        blockPrint
      </div>

      {/* Notebooks Section Header */}
      <div className="flex items-center justify-between text-s font-semibold uppercase tracking-wider text-slate-500 mb-3 px-2">
        <span>Notebooks</span>
        <button
          onClick={createNotebook}
          className="flex items-center justify-center w-6 h-6 rounded-md bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 hover:border-slate-700 transition-all duration-150 shadow-sm"
          title="Create new notebook"
        >
          <LuPlus className="w-4 h-4 stroke-[2.5]" />
        </button>
      </div>

      {/* Reordering List Container */}
      <nav className="flex flex-col h-[calc(100vh-140px)] mt-4">
        <div className="flex-1 overflow-y-auto space-y-1">
          <SortableList
            items={notebookTitles}
            onMoveItem={moveNotebookToIndex}
            renderItem={(notebook) => {
              const isActive = notebook.id === activeNotebookId;

              return (
                <div
                  key={notebook.id}
                  className="group relative flex items-center w-full mb-1"
                >
                  <button
                    onClick={() => {
                      setActiveNotebookId(notebook.id);
                      setActiveMenu(null); // Close any hanging menus on switch
                    }}
                    className={`flex items-center w-full text-left pl-3 pr-8 py-2 text-sm rounded-md transition-all duration-150 truncate ${
                      isActive
                        ? 'bg-slate-900 text-slate-100 font-bold shadow-sm'
                        : 'text-slate-400 hover:bg-slate-900/40 hover:text-slate-200'
                    }`}
                  >
                    <span
                      data-drag-handle-for={notebook.id}
                      draggable="true"
                      onDragStart={(e) => {
                        e.dataTransfer.setData('text/plain', notebook.id);
                        e.dataTransfer.effectAllowed = 'move';
                        setActiveMenu(null); // Close active menu when drag starts
                      }}
                      className={`mr-2 cursor-grab active:cursor-grabbing transition-colors duration-150 ${
                        isActive
                          ? 'text-blue-400'
                          : 'text-slate-600 group-hover:text-slate-400'
                      }`}
                    >
                      📓
                    </span>

                    <span className="truncate">
                      {notebook.title || 'Untitled'}
                    </span>
                  </button>

                  {/* Floating Three-Dots Button Menu */}
                  <div
                    className={`absolute right-2 transition-opacity duration-150 ${
                      activeMenu?.notebookId === notebook.id
                        ? 'opacity-100'
                        : 'opacity-0 group-hover:opacity-100'
                    }`}
                  >
                    <button
                      onClick={(e) => handleMenuClick(e, notebook.id)}
                      className={`flex items-center justify-center w-5 h-5 rounded transition-colors text-xs font-bold ${
                        activeMenu?.notebookId === notebook.id
                          ? 'bg-slate-800 text-slate-200'
                          : 'hover:bg-slate-800 text-slate-500 hover:text-slate-300'
                      }`}
                      title="Notebook options"
                    >
                      &#8942;
                    </button>
                  </div>
                </div>
              );
            }}
          />
        </div>
        <div className="pt-4 border-t border-slate-800/60 mt-auto">
          <SidebarLayoutToggle />
        </div>
      </nav>

      {/* 💡 Mounted Portal/Modal for the dropdown content */}
      {activeMenu && (
        <Modal
          onClose={() => setActiveMenu(null)}
          menuPosition={activeMenu.position}
        >
          <div className="w-36 p-1 flex flex-col text-left">
            <button
              onClick={() => {
                deleteNotebook(activeMenu.notebookId);
                setActiveMenu(null);
              }}
              className="w-full bg-transparent border-0 outline-none m-0 pt-1 text-left text-xs font-medium text-red-400 hover:bg-red-500/10 rounded transition-colors duration-100 border-t-2 border-slate-800"
            >
              Delete Notebook
            </button>
            {/* Future option shells can layer right here easily */}
          </div>
        </Modal>
      )}
    </>
  );
};

export default Sidebar;
