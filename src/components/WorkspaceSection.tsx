import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Layout, Settings, Globe } from 'lucide-react';
import { WorkspaceCard } from '../types';

interface WorkspaceSectionProps {
  tc: any; isMonochromeMode: boolean; filteredWorkspaceCards: WorkspaceCard[];
  setCardFormData: (data: any) => void; setEditingCardId: (id: string | null) => void;
  setWorkspaceModalOpen: (val: boolean) => void; workspaceCards: WorkspaceCard[];
}

/**
 * Grid contendo os atalhos e cards customizados do Workspace
 */
export const WorkspaceSection: React.FC<WorkspaceSectionProps> = ({
  tc, isMonochromeMode, filteredWorkspaceCards, setCardFormData, setEditingCardId, setWorkspaceModalOpen, workspaceCards
}) => {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full max-w-6xl mt-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredWorkspaceCards.map((card, index) => (
            <motion.div key={card.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: (index % 12) * 0.03 }} className="group relative cursor-pointer" onClick={() => { if (card.url) window.open(card.url, '_blank', 'noopener,noreferrer'); }}>
              <div className={`relative aspect-video rounded-xl overflow-hidden mb-3 ${tc.videoCardBg} ${tc.videoCardBorder} flex items-center justify-center border`}>
                {card.image ? (
                  <img src={card.image} alt={card.title} className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-105 ${isMonochromeMode ? `${tc.monochromeFilter} ${tc.monochromeFilterHover}` : ''}`} referrerPolicy="no-referrer" />
                ) : (
                  <div className={`w-full h-full flex flex-col items-center justify-center ${tc.text} opacity-20`}>
                    <Layout className="w-8 h-8 mb-2" />
                    <span className="text-xs">Sem Imagem</span>
                  </div>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setCardFormData({ title: card.title, url: card.url, icon: card.icon, image: card.image });
                    setEditingCardId(card.id);
                    setWorkspaceModalOpen(true);
                  }}
                  className="absolute top-2 right-2 p-2 rounded-full backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 hover:bg-black/70 text-white z-10"
                >
                  <Settings className="w-4 h-4" />
                </button>
              </div>
              <div className="flex items-center gap-3 px-1">
                {card.icon ? (
                  <img src={card.icon} alt={card.title} className="w-5 h-5 rounded-md object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-5 h-5 rounded-md flex items-center justify-center bg-black/10">
                    <Globe className="w-3 h-3 opacity-50" />
                  </div>
                )}
                <h3 className={`text-[0.85rem] font-medium truncate ${tc.videoTitleText} ${tc.videoTitleHoverText}`}>{card.title}</h3>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      {workspaceCards.length === 0 && (
        <div className={`text-center mt-20 text-[0.85rem] ${tc.text} opacity-50`}>
          Use "add: Nome do Site" na barra de pesquisa para criar um novo card no workspace.
        </div>
      )}
    </motion.div>
  );
};
