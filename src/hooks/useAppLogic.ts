import { ChangeEvent, FormEvent, MouseEvent as ReactMouseEvent, useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { webEngines, allEngines } from '../constants/engines';
import { fetchYouTubeChannels, fetchYouTubeVideos, fetchYouTubeVideosByChannel, fetchYouTubeFeed } from '../services/youtube';
import { VideoResult, ChannelResult, Subscription, WorkspaceCard, SearchEngine } from '../types';
import { ThemePreference } from '../constants/themeClasses';

export type ChatSession = {
  id: string;
  title: string;
  updatedAt: number;
  messages: Array<{ role: 'user' | 'model'; content: string; attachments?: string[] }>;
};

/**
 * Custom hook para gerenciar toda a lógica de estado do App
 */
export const useAppLogic = () => {
  const [activeEngineId, setActiveEngineId] = useState(() => localStorage.getItem('preferredEngine') || 'google');
  const [searchQuery, setSearchQuery] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSubmenuOpen, setIsSubmenuOpen] = useState(false);
  const [isThemeSubmenuOpen, setIsThemeSubmenuOpen] = useState(false);
  const [isDataSubmenuOpen, setIsDataSubmenuOpen] = useState(false);
  const [youtubeApiKey, setYoutubeApiKey] = useState(() => {
    const envKey = (import.meta as ImportMeta & { env: Record<string, string> }).env?.VITE_YOUTUBE_API_KEY;
    return envKey || localStorage.getItem('youtubeApiKey') || '';
  });
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);
  const [isMonochromeMode, setIsMonochromeMode] = useState(() => localStorage.getItem('isMonochromeMode') === 'true');
  const [workspaceSearchFallback, setWorkspaceSearchFallback] = useState(() => localStorage.getItem('workspaceSearchFallback') === 'true');
  const [themePreference, setThemePreference] = useState<ThemePreference>(() => (localStorage.getItem('themePreference') as ThemePreference) || 'system');
  const [lastSearchEngineId, setLastSearchEngineId] = useState(() => localStorage.getItem('lastSearchEngineId') || 'google');
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>(() => window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');

  const [isAiMode, setIsAiMode] = useState(false);
  const envGeminiKey = ((import.meta as ImportMeta & { env: Record<string, string> }).env?.VITE_GEMINI_API_KEY) || '';
  const [geminiApiKey, setGeminiApiKey] = useState(() => envGeminiKey || localStorage.getItem('geminiApiKey') || '');
  const [geminiModel, setGeminiModel] = useState(() => localStorage.getItem('geminiModel') || 'gemini-1.5-flash');

  const [chatSessions, setChatSessions] = useState<ChatSession[]>(() => {
    const savedSessions = localStorage.getItem('chatSessions');
    if (savedSessions) return JSON.parse(savedSessions);
    const savedMessages = localStorage.getItem('chatMessages');
    if (savedMessages) {
      const parsed = JSON.parse(savedMessages);
      if (parsed.length > 0) {
        return [{ id: Date.now().toString(), title: 'Previous Chat', updatedAt: Date.now(), messages: parsed }];
      }
    }
    return [];
  });
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  const chatMessages = useMemo(() => {
    if (!currentSessionId) return [];
    return chatSessions.find(s => s.id === currentSessionId)?.messages || [];
  }, [currentSessionId, chatSessions]);

  const [attachments, setAttachments] = useState<string[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);

  const [videoResultsList, setVideoResultsList] = useState<VideoResult[]>([]);
  const [channelResultsList, setChannelResultsList] = useState<ChannelResult[]>([]);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [isContentLoading, setIsContentLoading] = useState(false);
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [hasPerformedSearch, setHasPerformedSearch] = useState(false);
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const [userSubscriptions, setUserSubscriptions] = useState<Subscription[]>(() => {
    const savedSubscriptions = localStorage.getItem('userSubscriptions');
    return savedSubscriptions ? JSON.parse(savedSubscriptions) : [];
  });
  const [isViewingFeed, setIsViewingFeed] = useState(true);

  const [workspaceCards, setWorkspaceCards] = useState<WorkspaceCard[]>(() => {
    const saved = localStorage.getItem('workspaceCards');
    return saved ? JSON.parse(saved) : [];
  });
  const [workspaceModalOpen, setWorkspaceModalOpen] = useState(false);
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [cardFormData, setCardFormData] = useState({ title: '', url: '', icon: '', image: '' });

  const [exportDataModalOpen, setExportDataModalOpen] = useState(false);
  const [exportDataJson, setExportDataJson] = useState('');
  const [youtubeTutorialModalOpen, setYoutubeTutorialModalOpen] = useState(false);

  const menuContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileInputAiRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentAppliedTheme = useMemo<Exclude<ThemePreference, 'system'>>(() => {
    return themePreference === 'system' ? systemTheme : (themePreference as Exclude<ThemePreference, 'system'>);
  }, [themePreference, systemTheme]);

  const currentActiveEngine = useMemo(() => allEngines.find(engine => engine.id === activeEngineId) || webEngines[0], [activeEngineId]);

  useEffect(() => {
    localStorage.setItem('preferredEngine', activeEngineId);
    if (webEngines.some(e => e.id === activeEngineId)) {
      setLastSearchEngineId(activeEngineId);
      localStorage.setItem('lastSearchEngineId', activeEngineId);
    }
  }, [activeEngineId]);

  useEffect(() => { localStorage.setItem('youtubeApiKey', youtubeApiKey); }, [youtubeApiKey]);
  useEffect(() => { localStorage.setItem('isMonochromeMode', String(isMonochromeMode)); }, [isMonochromeMode]);
  useEffect(() => { localStorage.setItem('workspaceSearchFallback', String(workspaceSearchFallback)); }, [workspaceSearchFallback]);
  useEffect(() => { localStorage.setItem('userSubscriptions', JSON.stringify(userSubscriptions)); }, [userSubscriptions]);
  useEffect(() => { localStorage.setItem('themePreference', themePreference); }, [themePreference]);
  useEffect(() => { localStorage.setItem('workspaceCards', JSON.stringify(workspaceCards)); }, [workspaceCards]);
  useEffect(() => { if (!envGeminiKey) localStorage.setItem('geminiApiKey', geminiApiKey); }, [geminiApiKey, envGeminiKey]);
  useEffect(() => { localStorage.setItem('geminiModel', geminiModel); }, [geminiModel]);
  useEffect(() => { localStorage.setItem('chatSessions', JSON.stringify(chatSessions)); }, [chatSessions]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: light)');
    const handleChange = (event: MediaQueryListEvent) => setSystemTheme(event.matches ? 'light' : 'dark');
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isAiLoading, isAiMode]);

  useEffect(() => { searchInputRef.current?.focus(); }, []);

  const handleChatScroll = useCallback(() => {
    if (!chatContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    setShowScrollButton(scrollHeight - scrollTop - clientHeight >= 100);
  }, []);

  const toggleChannelSubscription = useCallback((channel: Subscription) => {
    setUserSubscriptions(prev => prev.some(s => s.id === channel.id) ? prev.filter(s => s.id !== channel.id) : [...prev, channel]);
  }, []);

  const loadUserSubscriptionFeed = useCallback(async () => {
    if (!youtubeApiKey || userSubscriptions.length === 0) return;
    setIsContentLoading(true);
    setIsViewingFeed(true);
    setHasPerformedSearch(true);
    setVideoResultsList([]);
    try {
      const feedData = await fetchYouTubeFeed(userSubscriptions.map(sub => sub.id), youtubeApiKey);
      setVideoResultsList(feedData.items);
      setNextPageToken(feedData.nextPageToken);
    } catch (error) {
      console.error(error);
    } finally {
      setIsContentLoading(false);
    }
  }, [youtubeApiKey, userSubscriptions]);

  useEffect(() => {
    if (activeEngineId === 'youtube' && youtubeApiKey && userSubscriptions.length > 0 && !hasPerformedSearch) {
      loadUserSubscriptionFeed();
    }
  }, [activeEngineId, youtubeApiKey, userSubscriptions, hasPerformedSearch, loadUserSubscriptionFeed]);

  useEffect(() => {
    function handleClickOutsideMenu(event: MouseEvent) {
      if (menuContainerRef.current && !menuContainerRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
        setIsSubmenuOpen(false);
        setIsThemeSubmenuOpen(false);
        setIsDataSubmenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutsideMenu);
    return () => document.removeEventListener('mousedown', handleClickOutsideMenu);
  }, []);

  const handleFileAttachment = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => file.type !== 'image/x-icon' && !file.name.endsWith('.ico'));
    if (validFiles.length < files.length) alert('Arquivos do tipo .ico não são suportados.');
    if (attachments.length + validFiles.length > 10) {
      alert('Máximo de 10 arquivos/imagens permitidos.');
      return;
    }
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) setAttachments(prev => [...prev, event.target!.result as string]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const handleAiSubmit = async (query: string, currentAttachments: string[]) => {
    if (!geminiApiKey) {
      alert('Chave de API do Gemini não configurada.');
      setShowSettingsPanel(true);
      return;
    }
    setIsAiLoading(true);
    const newMessage = { role: 'user' as const, content: query, attachments: currentAttachments };
    const sessionIdToUse = currentSessionId || Date.now().toString();
    let messagesToSend = [...chatMessages, newMessage];

    setChatSessions(prev => {
      let updated = [...prev];
      const idx = updated.findIndex(s => s.id === sessionIdToUse);
      if (idx === -1) {
        updated.unshift({ id: sessionIdToUse, title: query.substring(0, 40) + (query.length > 40 ? '...' : ''), updatedAt: Date.now(), messages: [newMessage] });
      } else {
        updated[idx] = { ...updated[idx], messages: [...updated[idx].messages, newMessage], updatedAt: Date.now() };
      }
      return updated;
    });

    if (!currentSessionId) setCurrentSessionId(sessionIdToUse);
    setSearchQuery('');
    setAttachments([]);

    try {
      const getParts = (msg: any) => {
        const parts: any[] = [];
        if (msg.content) parts.push({ text: msg.content });
        if (msg.attachments) {
          msg.attachments.forEach((att: string) => {
            const match = att.match(/^data:(.*?);base64,(.*)$/);
            if (match) parts.push({ inlineData: { mimeType: match, data: match } });
          });
        }
        if (parts.length === 0) parts.push({ text: "Analise as imagens anexadas." });
        return parts;
      };

      const contents: any[] = [];
      messagesToSend.forEach(msg => {
        const role = msg.role === 'user' ? 'user' : 'model';
        const parts = getParts(msg);
        if (contents.length > 0 && contents[contents.length - 1].role === role) {
          contents[contents.length - 1].parts.push(...parts);
        } else {
          contents.push({ role, parts });
        }
      });

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${geminiApiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents })
      });

      if (!response.ok) {
        const textStr = await response.text();
        let errData;
        try { errData = JSON.parse(textStr); } catch (e) { }
        throw new Error(errData?.error?.message || `API error (${response.status})`);
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Sem resposta.';

      setChatSessions(prev => {
        const updated = [...prev];
        const idx = updated.findIndex(s => s.id === sessionIdToUse);
        if (idx >= 0) updated[idx] = { ...updated[idx], messages: [...updated[idx].messages, { role: 'model', content: text }], updatedAt: Date.now() };
        return updated;
      });
    } catch (error: any) {
      console.error(error);
      setChatSessions(prev => {
        const updated = [...prev];
        const idx = updated.findIndex(s => s.id === sessionIdToUse);
        if (idx >= 0) updated[idx] = { ...updated[idx], messages: [...updated[idx].messages, { role: 'model', content: `Erro: ${error.message}` }], updatedAt: Date.now() };
        return updated;
      });
    } finally {
      setIsAiLoading(false);
    }
  };

  const executeSearch = useCallback(async (event: React.FormEvent) => {
    event.preventDefault();
    if (isAiMode) {
      if (!searchQuery.trim() && attachments.length === 0) return;
      handleAiSubmit(searchQuery, attachments);
      return;
    }
    if (!searchQuery.trim()) {
      if (activeEngineId === 'youtube' && userSubscriptions.length > 0) loadUserSubscriptionFeed();
      return;
    }
    if (activeEngineId === 'workspace') {
      if (searchQuery.toLowerCase().startsWith('add:')) {
        const name = searchQuery.substring(4).trim();
        const newCard: WorkspaceCard = { id: Date.now().toString(), title: name, url: '', icon: '', image: '' };
        setWorkspaceCards(prev => [...prev, newCard]);
        setSearchQuery('');
        setCardFormData({ title: name, url: '', icon: '', image: '' });
        setEditingCardId(newCard.id);
        setWorkspaceModalOpen(true);
        return;
      }
      if (workspaceSearchFallback) {
        const fallbackEngine = webEngines.find(e => e.id === lastSearchEngineId) || webEngines[0];
        window.location.href = fallbackEngine.url + encodeURIComponent(searchQuery);
      }
      return;
    }
    if (activeEngineId === 'youtube' && youtubeApiKey) {
      setIsContentLoading(true);
      setIsViewingFeed(false);
      setVideoResultsList([]);
      setChannelResultsList([]);
      setHasPerformedSearch(true);
      setSelectedChannelId(null);
      try {
        const [channelsData, videosData] = await Promise.all([
          fetchYouTubeChannels(searchQuery, youtubeApiKey),
          fetchYouTubeVideos(searchQuery, youtubeApiKey)
        ]);
        setChannelResultsList(channelsData);
        setVideoResultsList(videosData.items);
        setNextPageToken(videosData.nextPageToken);
      } catch (error) {
        console.error(error);
      } finally {
        setIsContentLoading(false);
      }
    } else {
      window.location.href = currentActiveEngine.url + encodeURIComponent(searchQuery);
    }
  }, [searchQuery, activeEngineId, youtubeApiKey, userSubscriptions, loadUserSubscriptionFeed, currentActiveEngine, workspaceSearchFallback, lastSearchEngineId, isAiMode, attachments, chatMessages, geminiApiKey, geminiModel]);

  const handleChannelSelection = useCallback(async (channelId: string) => {
    setIsContentLoading(true);
    setSelectedChannelId(channelId);
    setVideoResultsList([]);
    try {
      const channelVideosData = await fetchYouTubeVideosByChannel(channelId, youtubeApiKey);
      setVideoResultsList(channelVideosData.items);
      setNextPageToken(channelVideosData.nextPageToken);
    } catch (error) {
      console.error(error);
    } finally {
      setIsContentLoading(false);
    }
  }, [youtubeApiKey]);

  const loadMoreVideos = useCallback(async () => {
    if (!nextPageToken || isContentLoading || !youtubeApiKey) return;
    setIsContentLoading(true);
    try {
      let moreVideosData;
      if (selectedChannelId) {
        moreVideosData = await fetchYouTubeVideosByChannel(selectedChannelId, youtubeApiKey, nextPageToken);
      } else {
        moreVideosData = await fetchYouTubeVideos(searchQuery, youtubeApiKey, nextPageToken);
      }
      setVideoResultsList(prev => [...prev, ...moreVideosData.items]);
      setNextPageToken(moreVideosData.nextPageToken);
    } catch (error) {
      console.error(error);
    } finally {
      setIsContentLoading(false);
    }
  }, [nextPageToken, isContentLoading, youtubeApiKey, selectedChannelId, searchQuery]);

  const handleExportData = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    const data = { preferredEngine: activeEngineId, youtubeApiKey, isMonochromeMode, workspaceSearchFallback, themePreference, workspaceCards, userSubscriptions, lastSearchEngineId, geminiApiKey, geminiModel, chatSessions };
    setExportDataJson(JSON.stringify(data, null, 2));
    setExportDataModalOpen(true);
    setIsMenuOpen(false); setIsDataSubmenuOpen(false);
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (data.preferredEngine) setActiveEngineId(data.preferredEngine);
        if (data.youtubeApiKey !== undefined) setYoutubeApiKey(data.youtubeApiKey);
        if (data.isMonochromeMode !== undefined) setIsMonochromeMode(data.isMonochromeMode);
        if (data.workspaceSearchFallback !== undefined) setWorkspaceSearchFallback(data.workspaceSearchFallback);
        if (data.themePreference) setThemePreference(data.themePreference);
        if (data.workspaceCards) setWorkspaceCards(data.workspaceCards);
        if (data.userSubscriptions) setUserSubscriptions(data.userSubscriptions);
        if (data.lastSearchEngineId) setLastSearchEngineId(data.lastSearchEngineId);
        if (data.geminiApiKey !== undefined) setGeminiApiKey(data.geminiApiKey);
        if (data.geminiModel !== undefined) setGeminiModel(data.geminiModel);
        if (data.chatSessions) setChatSessions(data.chatSessions);
      } catch (error) {
        alert("Arquivo de backup inválido.");
      }
    };
    reader.readAsText(file);
    setIsMenuOpen(false); setIsDataSubmenuOpen(false);
    event.target.value = '';
  };

  return {
    activeEngineId, setActiveEngineId, searchQuery, setSearchQuery, isMenuOpen, setIsMenuOpen,
    isSubmenuOpen, setIsSubmenuOpen, isThemeSubmenuOpen, setIsThemeSubmenuOpen, isDataSubmenuOpen, setIsDataSubmenuOpen,
    youtubeApiKey, setYoutubeApiKey, showSettingsPanel, setShowSettingsPanel, isMonochromeMode, setIsMonochromeMode,
    workspaceSearchFallback, setWorkspaceSearchFallback, themePreference, setThemePreference,
    isAiMode, setIsAiMode, geminiApiKey, setGeminiApiKey, geminiModel, setGeminiModel,
    chatSessions, setChatSessions, currentSessionId, setCurrentSessionId, showHistoryModal, setShowHistoryModal,
    chatMessages, attachments, setAttachments, isAiLoading, showScrollButton, videoResultsList, channelResultsList,
    isContentLoading, selectedVideoId, setSelectedVideoId, hasPerformedSearch, selectedChannelId, userSubscriptions,
    isViewingFeed, workspaceCards, setWorkspaceCards, workspaceModalOpen, setWorkspaceModalOpen, editingCardId, setEditingCardId,
    cardFormData, setCardFormData, exportDataModalOpen, setExportDataModalOpen, exportDataJson, youtubeTutorialModalOpen, setYoutubeTutorialModalOpen,
    menuContainerRef, fileInputRef, fileInputAiRef, chatContainerRef, searchInputRef, messagesEndRef,
    currentAppliedTheme, currentActiveEngine, handleChatScroll, toggleChannelSubscription, handleFileAttachment,
    executeSearch, handleChannelSelection, loadMoreVideos, handleExportData, handleImportData, nextPageToken
  };
};
