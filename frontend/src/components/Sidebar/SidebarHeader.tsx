import { LuUser } from 'react-icons/lu';
import { CommandMenus } from '../../state/types';
import { useModalStore } from '../../state/useModalStore';

const SidebarHeader = () => {
  const openMenu = useModalStore((state) => state.openMenu);

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const position = {
      top: 0,
      left: 0,
    };
    openMenu(CommandMenus.UserCommand, position);
  };

  return (
    <div className="flex items-center justify-between border-b border-b-line mb-4 pb-2 px-2">
      <span className="text-sm font-bold uppercase tracking-wider text-accent-blue">
        blockPrint PM
      </span>
      <div onClick={handleMenuClick}>
        <LuUser className="w-6 h-6 p-0.5 border-2 rounded-full cursor-pointer text-accent-blue/85 hover:text-accent-blue" />
      </div>
    </div>
  );
};

export default SidebarHeader;
