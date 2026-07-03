import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Settings, Info, Youtube, Play } from "lucide-react";
import { useAppLogic } from "./hooks/useAppLogic";
import { themeClasses, ThemePreference } from "./constants/themeClasses";
import { webEngines, otherEngines } from "./constants/engines";

// Sub-componentes modulares desacoplados
import { SettingsPanel } from "./components/SettingsPanel";
import { YouTubeSection } from "./components/YouTubeSection";
import { WorkspaceSection } from "./components/WorkspaceSection";
import { ModalsContainer } from "./components/ModalsContainer";
import VideoModal from "./components/VideoModal";

export default function App() {
  const logic = useAppLogic();
  const tc = themeClasses[logic.currentAppliedTheme];
  const filteredWorkspaceCards = logic.workspaceCards.filter((card) =>
    card.title.toLowerCase().includes(logic.searchQuery.toLowerCase()),
  );

  const YoutubeTutorialContent = () => (
    <div
      className={`space-y-4 text-[0.85rem] sm:text-[0.9rem] leading-relaxed ${tc.text} opacity-90`}
    >
      <p>
        Para buscar e assistir vídeos diretamente no{" "}
        <strong>Search Mini</strong>, você precisa de uma chave de API gratuita
        do <strong>YouTube Data API v3</strong>.
      </p>
      <ol className="list-decimal list-inside space-y-2 ml-2">
        <li>
          Acesse o{" "}
          <a
            href="https://console.cloud.google.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline"
          >
            Google Cloud Console
          </a>
          .
        </li>
        <li>
          Crie um <strong>Novo Projeto</strong> ou selecione um existente.
        </li>
        <li>
          Acesse <strong>APIs & Serviços</strong> &gt;{" "}
          <strong>Biblioteca</strong>.
        </li>
        <li>
          Busque por <strong>YouTube Data API v3</strong> e clique em{" "}
          <strong>Ativar</strong>.
        </li>
        <li>
          Abra as <strong>Credenciais</strong>, clique em{" "}
          <strong>Criar Credenciais</strong> e escolha{" "}
          <strong>Chave de API</strong>.
        </li>
        <li>
          Copie a chave gerada e cole nas configurações (ícone de engrenagem).
        </li>
      </ol>
      <div className="mt-6 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-start gap-3">
        <Youtube className="w-6 h-6 text-blue-500 flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="font-semibold mb-1">Prefere um guia em vídeo?</h4>
          <a
            href="https://www.youtube.com/watch?v=tGJPSytMU5g"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-medium text-blue-500 hover:text-blue-600"
          >
            Assistir tutorial no YouTube <Play className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );

  return (
    <div
      className={`min-h-screen overflow-x-hidden ${tc.bg} ${tc.text} ${tc.selection}`}
    >
      <input
        type="file"
        accept=".json"
        ref={logic.fileInputRef}
        onChange={logic.handleImportData}
        className="hidden"
      />

      <main className="flex flex-col items-center p-4 relative min-h-screen">
        <motion.div
          layout
          className={`w-full flex justify-center z-50 ${logic.activeEngineId === "youtube" || logic.activeEngineId === "workspace" ? "mt-12 sm:mt-20 mb-8" : "mt-[45vh] -translate-y-1/2 mb-0"}`}
        >
          <motion.div
            layout
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ layout: { duration: 0.7, ease: [0.25, 1, 0.5, 1] } }}
            className="relative w-full max-w-[480px] flex flex-col items-center"
          >
            <div className="w-[90%] sm:w-[85%] flex items-center gap-2 transition-all duration-500 relative z-20 focus-within:w-full focus-within:-translate-y-0.5">
              <form
                onSubmit={logic.executeSearch}
                className={`search-box flex-1 flex items-center rounded-[14px] px-3.5 py-2 backdrop-blur-xl transition-all duration-500 ${tc.searchBoxBg} ${tc.searchBoxBorder} ${tc.searchBoxFocusBg} ${tc.searchBoxFocusBorder} ${tc.searchBoxShadow} border`}
              >
                <div className="relative" ref={logic.menuContainerRef}>
                  <button
                    type="button"
                    onClick={() => logic.setIsMenuOpen(!logic.isMenuOpen)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all text-[0.85rem] font-medium ${tc.buttonText} ${tc.buttonHoverBg} ${tc.buttonHoverText}`}
                  >
                    <span>{logic.currentActiveEngine.name}</span>
                  </button>

                  <AnimatePresence>
                    {logic.isMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        className={`absolute top-[calc(100%+12px)] left-0 w-[200px] rounded-xl p-1.5 backdrop-blur-[25px] z-10 ${tc.menuBg} ${tc.menuBorder} ${tc.menuShadow}`}
                      >
                        <div
                          className="relative group/submenu"
                          onMouseEnter={() => logic.setIsSubmenuOpen(true)}
                          onMouseLeave={() => logic.setIsSubmenuOpen(false)}
                        >
                          <div
                            className={`flex items-center justify-between px-3 py-2.5 text-[0.85rem] rounded-lg cursor-pointer ${tc.buttonText} ${tc.buttonHoverBg} ${tc.buttonHoverText}`}
                          >
                            <span>Pesquisa Web</span>
                            <span className="text-[0.7rem] opacity-50">›</span>
                          </div>
                          <AnimatePresence>
                            {logic.isSubmenuOpen && (
                              <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                className={`absolute top-0 left-[calc(100%+8px)] w-[160px] rounded-xl p-1.5 backdrop-blur-[25px] ${tc.menuBg} ${tc.menuBorder} ${tc.menuShadow}`}
                              >
                                {webEngines.map((engine) => (
                                  <button
                                    key={engine.id}
                                    type="button"
                                    onClick={() => {
                                      logic.setActiveEngineId(engine.id);
                                      logic.setIsAiMode(false);
                                      logic.setIsMenuOpen(false);
                                      logic.setIsSubmenuOpen(false);
                                    }}
                                    className={`w-full flex items-center justify-between px-3 py-2 text-[0.8rem] rounded-lg transition-all ${tc.buttonHoverBg} ${logic.activeEngineId === engine.id ? `${tc.text} font-medium` : tc.buttonText}`}
                                  >
                                    <span className="flex items-center gap-2">
                                      {engine.icon}
                                      {engine.name}
                                    </span>
                                  </button>
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        {otherEngines.map((engine) => (
                          <button
                            key={engine.id}
                            type="button"
                            onClick={() => {
                              logic.setActiveEngineId(engine.id);
                              logic.setIsAiMode(false);
                              logic.setIsMenuOpen(false);
                            }}
                            className={`w-full flex items-center justify-between px-3 py-2.5 text-[0.85rem] rounded-lg transition-all ${tc.buttonHoverBg} ${logic.activeEngineId === engine.id ? `${tc.text} font-medium` : tc.buttonText}`}
                          >
                            <span className="flex items-center gap-2">
                              {engine.icon}
                              {engine.name}
                            </span>
                          </button>
                        ))}

                        <div
                          className={`my-1 border-t ${tc.settingsDivider}`}
                        />
                        <div
                          className="relative group/theme-submenu"
                          onMouseEnter={() => logic.setIsThemeSubmenuOpen(true)}
                          onMouseLeave={() =>
                            logic.setIsThemeSubmenuOpen(false)
                          }
                        >
                          <div
                            className={`flex items-center justify-between px-3 py-2.5 text-[0.85rem] rounded-lg cursor-pointer ${tc.buttonText} ${tc.buttonHoverBg} ${tc.buttonHoverText}`}
                          >
                            <span>Tema</span>
                            <span className="text-[0.7rem] opacity-50">›</span>
                          </div>
                          <AnimatePresence>
                            {logic.isThemeSubmenuOpen && (
                              <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                className={`absolute bottom-[-4px] left-[calc(100%+8px)] w-[140px] rounded-xl p-1.5 backdrop-blur-[25px] ${tc.menuBg} ${tc.menuBorder} ${tc.menuShadow}`}
                              >
                                {(
                                  [
                                    "system",
                                    "light",
                                    "dark",
                                    "black",
                                    "pastel",
                                  ] as ThemePreference[]
                                ).map((t) => (
                                  <button
                                    key={t}
                                    type="button"
                                    onClick={() => {
                                      logic.setThemePreference(t);
                                      logic.setIsMenuOpen(false);
                                      logic.setIsThemeSubmenuOpen(false);
                                    }}
                                    className={`w-full text-left px-3 py-2 text-[0.8rem] rounded-lg transition-all ${tc.buttonHoverBg} ${logic.themePreference === t ? `${tc.text} font-medium` : tc.buttonText}`}
                                  >
                                    {t}
                                  </button>
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        <div
                          className={`my-1 border-t ${tc.settingsDivider}`}
                        />
                        <div
                          className="relative group/data-submenu"
                          onMouseEnter={() => logic.setIsDataSubmenuOpen(true)}
                          onMouseLeave={() => logic.setIsDataSubmenuOpen(false)}
                        >
                          <div
                            className={`flex items-center justify-between px-3 py-2.5 text-[0.85rem] rounded-lg cursor-pointer ${tc.buttonText} ${tc.buttonHoverBg} ${tc.buttonHoverText}`}
                          >
                            <span>Data</span>
                            <span className="text-[0.7rem] opacity-50">›</span>
                          </div>
                          <AnimatePresence>
                            {logic.isDataSubmenuOpen && (
                              <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                className={`absolute bottom-[-4px] left-[calc(100%+8px)] w-[140px] rounded-xl p-1.5 backdrop-blur-[25px] ${tc.menuBg} ${tc.menuBorder} ${tc.menuShadow}`}
                              >
                                <button
                                  type="button"
                                  onClick={logic.handleExportData}
                                  className={`w-full text-left px-3 py-2 text-[0.8rem] rounded-lg transition-all ${tc.buttonHoverBg} ${tc.buttonText}`}
                                >
                                  Exportar
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    logic.fileInputRef.current?.click()
                                  }
                                  className={`w-full text-left px-3 py-2 text-[0.8rem] rounded-lg transition-all ${tc.buttonHoverBg} ${tc.buttonText}`}
                                >
                                  Importar
                                </button>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className={`w-px h-[18px] mx-2.5 ${tc.divider}`} />

                <input
                  ref={logic.searchInputRef}
                  type="text"
                  value={logic.searchQuery}
                  onChange={(e) => logic.setSearchQuery(e.target.value)}
                  autoComplete="off"
                  spellCheck="false"
                  placeholder={`Pesquisar no ${logic.currentActiveEngine.name}...`}
                  className={`flex-1 bg-transparent border-none outline-none text-[0.95rem] ${tc.text} ${tc.inputPlaceholder} w-full`}
                />

                <div className="flex items-center ml-1 gap-1">
                  {logic.activeEngineId === "youtube" &&
                    logic.youtubeApiKey && (
                      <button
                        type="button"
                        onClick={() => logic.setYoutubeTutorialModalOpen(true)}
                        className={`flex items-center justify-center p-1.5 rounded-lg transition-colors ${tc.buttonText} ${tc.buttonHoverBg} opacity-60 hover:opacity-100`}
                        title="Ver API Tutorial"
                      >
                        <Info className="w-4 h-4" />
                      </button>
                    )}
                </div>
              </form>

              {(logic.activeEngineId === "youtube" ||
                logic.activeEngineId === "workspace") && (
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() =>
                      logic.setShowSettingsPanel(!logic.showSettingsPanel)
                    }
                    className={`flex items-center justify-center w-[42px] h-[42px] rounded-[14px] backdrop-blur-xl transition-all border hover:-translate-y-0.5 ${tc.searchBoxBg} ${tc.searchBoxBorder} ${tc.buttonText} ${tc.buttonHoverBg}`}
                    title="Configurações"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            <AnimatePresence>
              {(logic.showSettingsPanel ||
                (logic.activeEngineId === "youtube" &&
                  !logic.youtubeApiKey)) && (
                <SettingsPanel
                  tc={tc}
                  activeEngineId={logic.activeEngineId}
                  youtubeApiKey={logic.youtubeApiKey}
                  setYoutubeApiKey={logic.setYoutubeApiKey}
                  isAiMode={false}
                  isMonochromeMode={logic.isMonochromeMode}
                  setIsMonochromeMode={logic.setIsMonochromeMode}
                  workspaceSearchFallback={logic.workspaceSearchFallback}
                  setWorkspaceSearchFallback={logic.setWorkspaceSearchFallback}
                  setShowSettingsPanel={logic.setShowSettingsPanel}
                />
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>

        {!logic.isAiMode &&
          logic.activeEngineId === "youtube" &&
          !logic.youtubeApiKey && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`w-full max-w-2xl mt-6 p-6 sm:p-8 rounded-3xl border ${tc.settingsPanelBg} ${tc.settingsPanelBorder} shadow-xl`}
            >
              <h2
                className={`text-xl font-bold mb-6 ${tc.text} flex items-center gap-3`}
              >
                <Info className="w-6 h-6 text-blue-500" /> Configuração do
                YouTube
              </h2>
              <YoutubeTutorialContent />
            </motion.div>
          )}

        {!logic.isAiMode &&
          logic.activeEngineId === "youtube" &&
          logic.youtubeApiKey &&
          (logic.hasPerformedSearch || logic.isViewingFeed) && (
            <YouTubeSection
              tc={tc}
              isMonochromeMode={logic.isMonochromeMode}
              currentAppliedTheme={logic.currentAppliedTheme}
              channelResultsList={logic.channelResultsList}
              videoResultsList={logic.videoResultsList}
              userSubscriptions={logic.userSubscriptions}
              isViewingFeed={logic.isViewingFeed}
              selectedChannelId={logic.selectedChannelId}
              isContentLoading={logic.isContentLoading}
              nextPageToken={logic.nextPageToken}
              handleChannelSelection={logic.handleChannelSelection}
              toggleChannelSubscription={logic.toggleChannelSubscription}
              setSelectedVideoId={logic.setSelectedVideoId}
              loadMoreVideos={logic.loadMoreVideos}
            />
          )}

        {!logic.isAiMode && logic.activeEngineId === "workspace" && (
          <WorkspaceSection
            tc={tc}
            isMonochromeMode={logic.isMonochromeMode}
            filteredWorkspaceCards={filteredWorkspaceCards}
            setCardFormData={logic.setCardFormData}
            setEditingCardId={logic.setEditingCardId}
            setWorkspaceModalOpen={logic.setWorkspaceModalOpen}
            workspaceCards={logic.workspaceCards}
          />
        )}
      </main>

      <VideoModal
        selectedVideoId={logic.selectedVideoId}
        onClose={() => logic.setSelectedVideoId(null)}
      />

      <ModalsContainer
        tc={tc}
        workspaceModalOpen={logic.workspaceModalOpen}
        setWorkspaceModalOpen={logic.setWorkspaceModalOpen}
        cardFormData={logic.cardFormData}
        setCardFormData={logic.setCardFormData}
        workspaceCards={logic.workspaceCards}
        setWorkspaceCards={logic.setWorkspaceCards}
        editingCardId={logic.editingCardId}
        exportDataModalOpen={logic.exportDataModalOpen}
        setExportDataModalOpen={logic.setExportDataModalOpen}
        exportDataJson={logic.exportDataJson}
        youtubeTutorialModalOpen={logic.youtubeTutorialModalOpen}
        setYoutubeTutorialModalOpen={logic.setYoutubeTutorialModalOpen}
        YoutubeTutorialContent={YoutubeTutorialContent}
      />

      <style>{`
        @import url("https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css");
        :root { font-family: 'Pretendard', sans-serif; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
