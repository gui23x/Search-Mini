import React from "react";
import { AnimatePresence, motion } from "motion/react";
import { X, Trash2, Download } from "lucide-react";

interface ModalsContainerProps {
  tc: any;
  workspaceModalOpen: boolean;
  setWorkspaceModalOpen: (val: boolean) => void;
  cardFormData: any;
  setCardFormData: (data: any) => void;
  workspaceCards: any[];
  setWorkspaceCards: (cards: any[]) => void;
  editingCardId: string | null;
  exportDataModalOpen: boolean;
  setExportDataModalOpen: (val: boolean) => void;
  exportDataJson: string;
  youtubeTutorialModalOpen: boolean;
  setYoutubeTutorialModalOpen: (val: boolean) => void;
  YoutubeTutorialContent: React.ComponentType;
}

/**
 * Agrupamento de modais auxiliares para manter a estrutura do App.tsx simplificada
 */
export const ModalsContainer: React.FC<ModalsContainerProps> = ({
  tc,
  workspaceModalOpen,
  setWorkspaceModalOpen,
  cardFormData,
  setCardFormData,
  workspaceCards,
  setWorkspaceCards,
  editingCardId,
  exportDataModalOpen,
  setExportDataModalOpen,
  exportDataJson,
  youtubeTutorialModalOpen,
  setYoutubeTutorialModalOpen,
  YoutubeTutorialContent,
}) => {
  return (
    <>
      <AnimatePresence>
        {workspaceModalOpen && (
          <div className="fixed inset-0 z- flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setWorkspaceModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`relative w-full max-w-md rounded-2xl p-6 shadow-2xl ${tc.menuBg} ${tc.menuBorder}`}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className={`text-lg font-bold mb-4 ${tc.text}`}>
                Configurar Card
              </h2>
              <div className="space-y-4">
                <div>
                  <label
                    className={`block text-[10px] font-semibold mb-1.5 tracking-wider ${tc.settingsLabelText}`}
                  >
                    Nome
                  </label>
                  <input
                    type="text"
                    value={cardFormData.title}
                    onChange={(e) =>
                      setCardFormData({
                        ...cardFormData,
                        title: e.target.value,
                      })
                    }
                    className={`w-full rounded-lg px-3 py-2 text-sm outline-none transition-colors ${tc.settingsInputBg} ${tc.settingsInputBorder} ${tc.settingsInputFocusBorder} ${tc.text}`}
                  />
                </div>
                <div>
                  <label
                    className={`block text-[10px] font-semibold mb-1.5 tracking-wider ${tc.settingsLabelText}`}
                  >
                    URL do Site
                  </label>
                  <input
                    type="text"
                    value={cardFormData.url}
                    onChange={(e) =>
                      setCardFormData({ ...cardFormData, url: e.target.value })
                    }
                    onBlur={() => {
                      if (!cardFormData.icon && cardFormData.url) {
                        try {
                          let chk = cardFormData.url.startsWith("http")
                            ? cardFormData.url
                            : "https://" + cardFormData.url;
                          setCardFormData((p) => ({
                            ...p,
                            icon: `https://www.google.com/s2/favicons?domain=${new URL(chk).hostname}&sz=128`,
                          }));
                        } catch {}
                      }
                    }}
                    placeholder="https://..."
                    className={`w-full rounded-lg px-3 py-2 text-sm outline-none transition-colors ${tc.settingsInputBg} ${tc.settingsInputBorder} ${tc.settingsInputFocusBorder} ${tc.text}`}
                  />
                </div>
                <div>
                  <label
                    className={`block text-[10px] font-semibold mb-1.5 tracking-wider ${tc.settingsLabelText}`}
                  >
                    Ícone (URL)
                  </label>
                  <input
                    type="text"
                    value={cardFormData.icon}
                    onChange={(e) =>
                      setCardFormData({ ...cardFormData, icon: e.target.value })
                    }
                    className={`w-full rounded-lg px-3 py-2 text-sm outline-none transition-colors ${tc.settingsInputBg} ${tc.settingsInputBorder} ${tc.settingsInputFocusBorder} ${tc.text}`}
                  />
                </div>
                <div>
                  <label
                    className={`block text-[10px] font-semibold mb-1.5 tracking-wider ${tc.settingsLabelText}`}
                  >
                    Imagem (URL)
                  </label>
                  <input
                    type="text"
                    value={cardFormData.image}
                    onChange={(e) =>
                      setCardFormData({
                        ...cardFormData,
                        image: e.target.value,
                      })
                    }
                    className={`w-full rounded-lg px-3 py-2 text-sm outline-none transition-colors ${tc.settingsInputBg} ${tc.settingsInputBorder} ${tc.settingsInputFocusBorder} ${tc.text}`}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button
                  onClick={() => {
                    setWorkspaceCards(
                      workspaceCards.filter((c) => c.id !== editingCardId),
                    );
                    setWorkspaceModalOpen(false);
                  }}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-red-500 hover:bg-red-500/10 transition-colors"
                >
                  Remover
                </button>
                <button
                  onClick={() => setWorkspaceModalOpen(false)}
                  className={`px-4 py-2 rounded-lg text-xs font-medium ${tc.buttonText} ${tc.buttonHoverBg} transition-colors`}
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    setWorkspaceCards(
                      workspaceCards.map((c) =>
                        c.id === editingCardId ? { ...c, ...cardFormData } : c,
                      ),
                    );
                    setWorkspaceModalOpen(false);
                  }}
                  className="px-4 py-2 rounded-lg text-xs font-medium bg-zinc-700 text-white hover:bg-zinc-600 transition-colors"
                >
                  Salvar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {exportDataModalOpen && (
          <div className="fixed inset-0 z- flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setExportDataModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`relative w-full max-w-2xl rounded-2xl p-6 shadow-2xl ${tc.menuBg} ${tc.menuBorder}`}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className={`text-lg font-bold mb-4 ${tc.text}`}>
                Exportar Dados
              </h2>
              <textarea
                value={exportDataJson}
                readOnly
                className={`w-full h-64 rounded-lg px-3 py-2 text-sm outline-none transition-colors resize-none font-mono ${tc.settingsInputBg} ${tc.settingsInputBorder} ${tc.settingsInputFocusBorder} ${tc.text}`}
              />
              <div className="flex justify-between items-center mt-6">
                <button
                  onClick={() => {
                    const blob = new Blob([exportDataJson], {
                      type: "application/json",
                    });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = "search-mini-backup.json";
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                  }}
                  className="p-2.5 rounded-lg text-xs font-medium bg-zinc-700 text-white hover:bg-zinc-600 transition-colors flex items-center justify-center"
                >
                  <Download className="w-5 h-5" />
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      navigator.clipboard.writeText(exportDataJson)
                    }
                    className={`px-4 py-2 rounded-lg text-xs font-medium ${tc.buttonText} ${tc.buttonHoverBg} transition-colors`}
                  >
                    Copiar
                  </button>
                  <button
                    onClick={() => setExportDataModalOpen(false)}
                    className={`px-4 py-2 rounded-lg text-xs font-medium ${tc.buttonText} ${tc.buttonHoverBg} transition-colors`}
                  >
                    Fechar
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {youtubeTutorialModalOpen && (
          <div className="fixed inset-0 z- flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setYoutubeTutorialModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`relative w-full max-w-2xl rounded-2xl p-6 shadow-2xl ${tc.menuBg} ${tc.menuBorder}`}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className={`text-lg font-bold mb-4 ${tc.text}`}>
                Tutorial: Chave de API do YouTube
              </h2>
              <YoutubeTutorialContent />
              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setYoutubeTutorialModalOpen(false)}
                  className={`px-4 py-2 rounded-lg text-xs font-medium ${tc.buttonText} ${tc.buttonHoverBg} transition-colors`}
                >
                  Fechar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
