import React from "react";
import { motion } from "motion/react";

interface SettingsPanelProps {
  tc: any;
  activeEngineId: string;
  youtubeApiKey: string;
  setYoutubeApiKey: (val: string) => void;
  isAiMode: false;
  isMonochromeMode: boolean;
  setIsMonochromeMode: (val: boolean) => void;
  workspaceSearchFallback: boolean;
  setWorkspaceSearchFallback: (val: boolean) => void;
  setShowSettingsPanel: (val: boolean) => void;
}

/**
 * Painel expansível de configurações globais e API keys
 */
export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  tc,
  activeEngineId,
  youtubeApiKey,
  setYoutubeApiKey,
  isMonochromeMode,
  setIsMonochromeMode,
  workspaceSearchFallback,
  setWorkspaceSearchFallback,
  setShowSettingsPanel,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="mt-6 w-full"
    >
      <div
        className={`rounded-xl p-4 backdrop-blur-md space-y-4 ${tc.settingsPanelBg} ${tc.settingsPanelBorder}`}
      >
        {activeEngineId === "youtube" && (
          <div>
            <label
              className={`block text-[10px] font-semibold mb-2.5 uppercase ${tc.settingsLabelText}`}
            >
              YouTube API Key
            </label>
            <input
              type="password"
              value={youtubeApiKey}
              onChange={(e) => setYoutubeApiKey(e.target.value)}
              placeholder="Chave v3..."
              className={`w-full rounded-lg px-3 py-2 text-xs outline-none transition-colors ${tc.settingsInputBg} ${tc.settingsInputBorder} ${tc.settingsInputFocusBorder} ${tc.text}`}
            />
          </div>
        )}

        <div
          className={`flex items-center justify-between ${activeEngineId === "youtube" ? `pt-2 border-t ${tc.settingsDivider}` : ""}`}
        >
          <label
            className={`text-[10px] font-semibold ${tc.settingsLabelText}`}
          >
            Modo Monocromático
          </label>
          <button
            onClick={() => setIsMonochromeMode(!isMonochromeMode)}
            className={`w-8 h-4 rounded-full transition-colors relative ${isMonochromeMode ? tc.settingsToggleBgOn : tc.settingsToggleBgOff}`}
          >
            <div
              className={`absolute top-0.5 w-3 h-3 rounded-full ${tc.settingsToggleCircleBg} transition-all ${isMonochromeMode ? "left-[17px]" : "left-0.5"}`}
            />
          </button>
        </div>

        {activeEngineId === "workspace" && (
          <div
            className={`flex items-center justify-between pt-2 border-t ${tc.settingsDivider}`}
          >
            <label
              className={`text-[10px] font-semibold ${tc.settingsLabelText}`}
            >
              Funcionar como Busca
            </label>
            <button
              onClick={() =>
                setWorkspaceSearchFallback(!workspaceSearchFallback)
              }
              className={`w-8 h-4 rounded-full transition-colors relative ${workspaceSearchFallback ? tc.settingsToggleBgOn : tc.settingsToggleBgOff}`}
            >
              <div
                className={`absolute top-0.5 w-3 h-3 rounded-full ${tc.settingsToggleCircleBg} transition-all ${workspaceSearchFallback ? "left-[17px]" : "left-0.5"}`}
              />
            </button>
          </div>
        )}

        <button
          onClick={() => setShowSettingsPanel(false)}
          className={`w-full py-2 rounded-lg text-[11px] font-medium transition-colors ${tc.settingsButtonBg} ${tc.settingsButtonHoverBg}`}
        >
          Salvar Configurações
        </button>
      </div>
    </motion.div>
  );
};
