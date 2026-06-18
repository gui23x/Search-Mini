import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Play, Settings, Clock, User, Globe, Layout, Download, Info, Youtube, Sparkles, Paperclip, Bot, Trash2, Copy, MessageSquare, Plus, X, ArrowDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { webEngines, otherEngines, allEngines } from './constants/engines';
import { fetchYouTubeChannels, fetchYouTubeVideos, fetchYouTubeVideosByChannel, fetchYouTubeFeed } from './services/youtube';
import { VideoResult, ChannelResult, Subscription, WorkspaceCard } from './types';
import VideoModal from './components/VideoModal';

type ThemePreference = 'system' | 'light' | 'dark' | 'black' | 'pastel';

export default function App() {
  const [activeEngineId, setActiveEngineId] = useState(() => localStorage.getItem('preferredEngine') || 'google');
  const [searchQuery, setSearchQuery] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSubmenuOpen, setIsSubmenuOpen] = useState(false);
  const [isThemeSubmenuOpen, setIsThemeSubmenuOpen] = useState(false);
  const [isDataSubmenuOpen, setIsDataSubmenuOpen] = useState(false);
  const [youtubeApiKey, setYoutubeApiKey] = useState(() => import.meta.env.VITE_YOUTUBE_API_KEY || localStorage.getItem('youtubeApiKey') || '');
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);
  const [isMonochromeMode, setIsMonochromeMode] = useState(() => localStorage.getItem('isMonochromeMode') === 'true');
  const [workspaceSearchFallback, setWorkspaceSearchFallback] = useState(() => localStorage.getItem('workspaceSearchFallback') === 'true');
  const [themePreference, setThemePreference] = useState<ThemePreference>(() => {
    return (localStorage.getItem('themePreference') as ThemePreference) || 'system';
  });
  const [lastSearchEngineId, setLastSearchEngineId] = useState(() => localStorage.getItem('lastSearchEngineId') || 'google');
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>(() =>
    window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
  );

  const [isAiMode, setIsAiMode] = useState(false);
  const [geminiApiKey, setGeminiApiKey] = useState(() => {
    try { return process.env.GEMINI_API_KEY || localStorage.getItem('geminiApiKey') || ''; }
    catch { return localStorage.getItem('geminiApiKey') || ''; }
  });
  const [geminiModel, setGeminiModel] = useState(() => localStorage.getItem('geminiModel') || 'gemini-1.5-flash');

  type ChatSession = {
    id: string;
    title: string;
    updatedAt: number;
    messages: Array<{ role: 'user' | 'model', content: string, attachments?: string[] }>;
  };

  const [chatSessions, setChatSessions] = useState<ChatSession[]>(() => {
    const savedSessions = localStorage.getItem('chatSessions');
    if (savedSessions) return JSON.parse(savedSessions);

    const savedMessages = localStorage.getItem('chatMessages');
    if (savedMessages) {
      const parsed = JSON.parse(savedMessages);
      if (parsed.length > 0) {
        return [{ id: Date.now().toString(), title: 'Chat Antigo', updatedAt: Date.now(), messages: parsed }];
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);

  const handleChatScroll = useCallback(() => {
    if (!chatContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    setShowScrollButton(!isNearBottom);
  }, []);

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
  const currentAppliedTheme = useMemo<Exclude<ThemePreference, 'system'>>(() => {
    if (themePreference === 'system') {
      return systemTheme;
    }
    return themePreference as Exclude<ThemePreference, 'system'>;
  }, [themePreference, systemTheme]);
  const currentActiveEngine = useMemo(() => allEngines.find(engine => engine.id === activeEngineId) || webEngines[0], [activeEngineId]); // Fallback to first web engine
  useEffect(() => {
    localStorage.setItem('preferredEngine', activeEngineId);
    if (webEngines.some(e => e.id === activeEngineId)) {
      setLastSearchEngineId(activeEngineId);
      localStorage.setItem('lastSearchEngineId', activeEngineId);
    }
  }, [activeEngineId]);

  useEffect(() => {
    localStorage.setItem('youtubeApiKey', youtubeApiKey);
  }, [youtubeApiKey]);

  useEffect(() => {
    localStorage.setItem('isMonochromeMode', String(isMonochromeMode));
  }, [isMonochromeMode]);

  useEffect(() => {
    localStorage.setItem('workspaceSearchFallback', String(workspaceSearchFallback));
  }, [workspaceSearchFallback]);

  useEffect(() => {
    localStorage.setItem('userSubscriptions', JSON.stringify(userSubscriptions));
  }, [userSubscriptions]);

  useEffect(() => {
    localStorage.setItem('themePreference', themePreference);
  }, [themePreference]);

  useEffect(() => {
    localStorage.setItem('workspaceCards', JSON.stringify(workspaceCards));
  }, [workspaceCards]);

  useEffect(() => {
    localStorage.setItem('geminiApiKey', geminiApiKey);
  }, [geminiApiKey]);

  useEffect(() => {
    localStorage.setItem('geminiModel', geminiModel);
  }, [geminiModel]);

  useEffect(() => {
    localStorage.setItem('chatSessions', JSON.stringify(chatSessions));
  }, [chatSessions]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: light)');
    const handleChange = (event: MediaQueryListEvent) => {
      setSystemTheme(event.matches ? 'light' : 'dark');
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isAiLoading, isAiMode]);

  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  // Function definitions
  const toggleChannelSubscription = useCallback((channel: Subscription) => {
    setUserSubscriptions(previousSubscriptions => {
      const isCurrentlySubscribed = previousSubscriptions.some(subscription => subscription.id === channel.id);
      if (isCurrentlySubscribed) {
        return previousSubscriptions.filter(subscription => subscription.id !== channel.id);
      }
      return [...previousSubscriptions, channel];
    });
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

  // Effect for loading user subscription feed on initial load or dependency change
  useEffect(() => {
    if (activeEngineId === 'youtube' && youtubeApiKey && userSubscriptions.length > 0 && !hasPerformedSearch) {
      loadUserSubscriptionFeed();
    }
  }, [activeEngineId, youtubeApiKey, userSubscriptions, hasPerformedSearch, loadUserSubscriptionFeed]);

  // Effect for handling clicks outside the menu
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

  const renderMarkdown = (content: string) => {
    const parts = content.split(/(```[\s\S]*?```)/g);
    return parts.map((part, index) => {
      if (part.startsWith('```') && part.endsWith('```')) {
        const match = part.match(/^```(\w*)\n?([\s\S]*?)```$/);
        const language = match && match[1] ? match[1] : 'code';
        const code = match && match[2] ? match[2] : part.slice(3, -3).replace(/^\n/, '');

        return (
          <div key={index} className="relative group my-3 rounded-xl bg-[#1e1e1e] text-gray-300 font-mono text-[13px] border border-white/10 shadow-lg flex flex-col">
            <div className="flex justify-between items-center px-4 py-2 bg-black/40 text-[10px] font-semibold tracking-wider text-gray-400 border-b border-white/5 uppercase">
              <span>{language}</span>
              <button
                onClick={() => navigator.clipboard.writeText(code)}
                className="flex items-center gap-1.5 hover:text-white transition-colors sticky top-0 right-0 z-10"
                title="Copiar código"
              >
                <Copy className="w-3 h-3" /> Copiar
              </button>
            </div>
            <div className="p-4 overflow-x-auto no-scrollbar flex-1">
              <pre className="!m-0"><code>{code}</code></pre>
            </div>
          </div>
        );
      }

      const inlineParts = part.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);
      return (
        <span key={index}>
          {inlineParts.map((ip, i) => {
            if (ip.startsWith('`') && ip.endsWith('`')) {
              return <code key={i} className="bg-black/20 text-[#e0a87a] px-1.5 py-0.5 rounded-md text-[0.9em] mx-0.5">{ip.slice(1, -1)}</code>;
            }
            if (ip.startsWith('**') && ip.endsWith('**')) {
              return <strong key={i} className="font-bold">{ip.slice(2, -2)}</strong>;
            }
            return <span key={i} className="whitespace-pre-wrap">{ip}</span>;
          })}
        </span>
      );
    });
  };

  const handleFileAttachment = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => file.type !== 'image/x-icon' && !file.name.endsWith('.ico'));

    if (validFiles.length < files.length) {
      alert('Arquivos do tipo .ico não são suportados e foram ignorados.');
    }

    if (attachments.length + validFiles.length > 10) {
      alert('Limite de 10 arquivos/imagens.');
      return;
    }
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setAttachments(prev => [...prev, event.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const handleAiSubmit = async (query: string, currentAttachments: string[]) => {
    if (!geminiApiKey) {
      alert('Configure a API Key do Gemini nas configurações.');
      setShowSettingsPanel(true);
      return;
    }
    setIsAiLoading(true);

    const newMessage = { role: 'user' as const, content: query, attachments: currentAttachments };
    const sessionIdToUse = currentSessionId || Date.now().toString();
    let messagesToSend = [...chatMessages, newMessage];

    setChatSessions(prev => {
      let updatedSessions = [...prev];
      const sessionIndex = updatedSessions.findIndex(s => s.id === sessionIdToUse);

      if (sessionIndex === -1) {
        updatedSessions.unshift({
          id: sessionIdToUse,
          title: query.substring(0, 40) + (query.length > 40 ? '...' : ''),
          updatedAt: Date.now(),
          messages: [newMessage]
        });
      } else {
        updatedSessions[sessionIndex] = {
          ...updatedSessions[sessionIndex],
          messages: [...updatedSessions[sessionIndex].messages, newMessage],
          updatedAt: Date.now()
        };
      }
      return updatedSessions;
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
            if (match) {
              parts.push({
                inlineData: { mimeType: match[1], data: match[2] }
              });
            }
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
        throw new Error(errData?.error?.message || `Erro na API (${response.status})`);
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Sem resposta.';

      setChatSessions(prev => {
        const updatedSessions = [...prev];
        const sessionIndex = updatedSessions.findIndex(s => s.id === sessionIdToUse);
        if (sessionIndex >= 0) {
          updatedSessions[sessionIndex] = {
            ...updatedSessions[sessionIndex],
            messages: [...updatedSessions[sessionIndex].messages, { role: 'model', content: text }],
            updatedAt: Date.now()
          };
        }
        return updatedSessions;
      });
    } catch (error: any) {
      console.error(error);
      setChatSessions(prev => {
        const updatedSessions = [...prev];
        const sessionIndex = updatedSessions.findIndex(s => s.id === sessionIdToUse);
        if (sessionIndex >= 0) {
          updatedSessions[sessionIndex] = {
            ...updatedSessions[sessionIndex],
            messages: [...updatedSessions[sessionIndex].messages, { role: 'model', content: `Erro: ${error.message}` }],
            updatedAt: Date.now()
          };
        }
        return updatedSessions;
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
      if (activeEngineId === 'youtube' && userSubscriptions.length > 0) {
        loadUserSubscriptionFeed();
      }
      return;
    }

    if (activeEngineId === 'workspace') {
      if (searchQuery.toLowerCase().startsWith('add:')) {
        const name = searchQuery.substring(4).trim();
        const newCard: WorkspaceCard = {
          id: Date.now().toString(),
          title: name,
          url: '',
          icon: '',
          image: ''
        };
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
      setVideoResultsList(previousResults => [...previousResults, ...moreVideosData.items]);
      setNextPageToken(moreVideosData.nextPageToken);
    } catch (error) {
      console.error(error);
    } finally {
      setIsContentLoading(false);
    }
  }, [nextPageToken, isContentLoading, youtubeApiKey, selectedChannelId, searchQuery]);

  const handleExportData = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const data = {
      preferredEngine: activeEngineId,
      youtubeApiKey,
      isMonochromeMode,
      workspaceSearchFallback,
      themePreference,
      workspaceCards,
      userSubscriptions,
      lastSearchEngineId,
      geminiApiKey,
      geminiModel,
      chatSessions
    };

    setExportDataJson(JSON.stringify(data, null, 2));
    setExportDataModalOpen(true);

    setIsMenuOpen(false);
    setIsDataSubmenuOpen(false);
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
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
        if (data.chatMessages && !data.chatSessions) {
          setChatSessions([{
            id: Date.now().toString(),
            title: 'Chat Importado',
            updatedAt: Date.now(),
            messages: data.chatMessages
          }]);
        }
      } catch (error) {
        console.error("Erro ao importar dados", error);
        alert("Arquivo de backup inválido.");
      }
    };
    reader.readAsText(file);
    setIsMenuOpen(false);
    setIsDataSubmenuOpen(false);
    event.target.value = '';
  };

  const themeClasses = {
    dark: {
      bg: 'bg-[#0a0a0a]',
      text: 'text-[#f0f0f0]',
      selection: 'selection:bg-white/10',
      searchBoxBg: 'bg-white/[0.03]',
      searchBoxBorder: 'border-white/[0.08]',
      searchBoxFocusBg: 'focus-within:bg-white/[0.06]',
      searchBoxFocusBorder: 'focus-within:border-white/20',
      searchBoxShadow: 'focus-within:shadow-[0_10px_40px_rgba(255,255,255,0.03)]',
      buttonHoverBg: 'hover:bg-white/[0.08]',
      buttonText: 'text-[#777]',
      buttonHoverText: 'hover:text-[#f0f0f0]',
      menuBg: 'bg-[#121212]/95',
      menuBorder: 'border-white/[0.08]',
      menuShadow: 'shadow-[0_12px_40px_rgba(0,0,0,0.5)]',
      inputPlaceholder: 'placeholder:text-[#777]',
      settingsPanelBg: 'bg-white/[0.03]',
      settingsPanelBorder: 'border-white/[0.08]',
      settingsLabelText: 'text-[#777]',
      settingsInputBg: 'bg-black/20',
      settingsInputBorder: 'border-white/[0.08]',
      settingsInputFocusBorder: 'focus:border-white/20',
      settingsToggleBgOn: 'bg-white/20',
      settingsToggleBgOff: 'bg-white/5',
      settingsToggleCircleBg: 'bg-[#f0f0f0]',
      settingsButtonBg: 'bg-white/[0.08]',
      settingsButtonHoverBg: 'hover:bg-white/[0.12]',
      channelTitleText: 'text-[#aaa]',
      channelCardBg: 'bg-white/[0.02]',
      channelCardHoverBg: 'hover:bg-white/[0.04]',
      channelCardSelectedBg: 'bg-white/[0.06]',
      channelCardSelectedBorder: 'border-white/20',
      channelThumbnailBorder: 'border-white/10',
      subscribeButtonBgSubscribed: 'bg-white/10',
      subscribeButtonBorderSubscribed: 'border-white/20',
      subscribeButtonTextSubscribed: 'text-white',
      subscribeButtonBgUnsubscribed: 'bg-black/40',
      subscribeButtonBorderUnsubscribed: 'border-white/5',
      subscribeButtonTextUnsubscribed: 'text-[#555]',
      subscriptionPillBg: 'bg-white/[0.03]',
      subscriptionPillBorder: 'border-white/[0.05]',
      subscriptionPillHoverBg: 'hover:bg-white/[0.06]',
      subscriptionPillText: 'text-[#aaa]',
      videoCardBg: 'bg-white/[0.03]',
      videoCardBorder: 'border-white/[0.05]',
      videoTitleText: 'text-[#aaa]',
      videoTitleHoverText: 'group-hover:text-[#f0f0f0]',
      videoMetaText: 'text-[#555]',
      videoPlayButtonBg: 'bg-white/10',
      videoPlayButtonBorder: 'border-white/20',
      loadingSpinnerBorder: 'border-white/10',
      loadingSpinnerBorderTop: 'border-t-white/40',
      loadMoreButtonBg: 'bg-white/[0.03]',
      loadMoreButtonHoverBg: 'hover:bg-white/[0.06]',
      loadMoreButtonBorder: 'border-white/[0.08]',
      headerText: 'text-[#444]',
      divider: 'bg-white/[0.08]',
      settingsDivider: 'border-white/[0.05]',
      monochromeFilter: 'grayscale opacity-60',
      monochromeFilterHover: 'group-hover:grayscale-0 group-hover:opacity-100',
      monochromeChannelFilterHover: 'group-hover/channel:grayscale-0 group-hover/channel:opacity-100',
    },
    light: {
      bg: 'bg-white',
      text: 'text-gray-900',
      selection: 'selection:bg-black/10',
      searchBoxBg: 'bg-gray-100',
      searchBoxBorder: 'border-gray-200',
      searchBoxFocusBg: 'focus-within:bg-gray-50',
      searchBoxFocusBorder: 'focus-within:border-blue-300',
      searchBoxShadow: 'focus-within:shadow-[0_10px_40px_rgba(0,0,0,0.05)]',
      buttonHoverBg: 'hover:bg-gray-200',
      buttonText: 'text-gray-600',
      buttonHoverText: 'hover:text-gray-900',
      menuBg: 'bg-white/95',
      menuBorder: 'border-gray-200',
      menuShadow: 'shadow-[0_12px_40px_rgba(0,0,0,0.1)]',
      inputPlaceholder: 'placeholder:text-gray-400',
      settingsPanelBg: 'bg-gray-100',
      settingsPanelBorder: 'border-gray-200',
      settingsLabelText: 'text-gray-600',
      settingsInputBg: 'bg-white',
      settingsInputBorder: 'border-gray-200',
      settingsInputFocusBorder: 'focus:border-blue-300',
      settingsToggleBgOn: 'bg-blue-500',
      settingsToggleBgOff: 'bg-gray-300',
      settingsToggleCircleBg: 'bg-white',
      settingsButtonBg: 'bg-gray-200',
      settingsButtonHoverBg: 'hover:bg-gray-300',
      channelTitleText: 'text-gray-700',
      channelCardBg: 'bg-gray-50',
      channelCardHoverBg: 'hover:bg-gray-100',
      channelCardSelectedBg: 'bg-gray-100',
      channelCardSelectedBorder: 'border-blue-300',
      channelThumbnailBorder: 'border-gray-200',
      subscribeButtonBgSubscribed: 'bg-blue-500',
      subscribeButtonBorderSubscribed: 'border-blue-600',
      subscribeButtonTextSubscribed: 'text-white',
      subscribeButtonBgUnsubscribed: 'bg-gray-200',
      subscribeButtonBorderUnsubscribed: 'border-gray-300',
      subscribeButtonTextUnsubscribed: 'text-gray-600',
      subscriptionPillBg: 'bg-gray-100',
      subscriptionPillBorder: 'border-gray-200',
      subscriptionPillHoverBg: 'hover:bg-gray-200',
      subscriptionPillText: 'text-gray-700',
      videoCardBg: 'bg-gray-100',
      videoCardBorder: 'border-gray-200',
      videoTitleText: 'text-gray-700',
      videoTitleHoverText: 'group-hover:text-gray-900',
      videoMetaText: 'text-gray-500',
      videoPlayButtonBg: 'bg-gray-200',
      videoPlayButtonBorder: 'border-gray-300',
      loadingSpinnerBorder: 'border-gray-300',
      loadingSpinnerBorderTop: 'border-t-blue-500',
      loadMoreButtonBg: 'bg-gray-100',
      loadMoreButtonHoverBg: 'hover:bg-gray-200',
      loadMoreButtonBorder: 'border-gray-200',
      headerText: 'text-gray-500',
      divider: 'bg-gray-200',
      settingsDivider: 'border-gray-200',
      monochromeFilter: 'grayscale opacity-60',
      monochromeFilterHover: 'group-hover:grayscale-0 group-hover:opacity-100',
      monochromeChannelFilterHover: 'group-hover/channel:grayscale-0 group-hover/channel:opacity-100',
    },
    black: {
      bg: 'bg-black',
      text: 'text-[#f0f0f0]',
      selection: 'selection:bg-white/10',
      searchBoxBg: 'bg-white/[0.03]',
      searchBoxBorder: 'border-white/[0.08]',
      searchBoxFocusBg: 'focus-within:bg-white/[0.06]',
      searchBoxFocusBorder: 'focus-within:border-white/20',
      searchBoxShadow: 'focus-within:shadow-[0_10px_40px_rgba(255,255,255,0.03)]',
      buttonHoverBg: 'hover:bg-white/[0.08]',
      buttonText: 'text-[#777]',
      buttonHoverText: 'hover:text-[#f0f0f0]',
      menuBg: 'bg-[#050505]/95',
      menuBorder: 'border-white/[0.08]',
      menuShadow: 'shadow-[0_12px_40px_rgba(0,0,0,0.5)]',
      inputPlaceholder: 'placeholder:text-[#777]',
      settingsPanelBg: 'bg-white/[0.03]',
      settingsPanelBorder: 'border-white/[0.08]',
      settingsLabelText: 'text-[#777]',
      settingsInputBg: 'bg-[#0a0a0a]',
      settingsInputBorder: 'border-white/[0.08]',
      settingsInputFocusBorder: 'focus:border-white/20',
      settingsToggleBgOn: 'bg-white/20',
      settingsToggleBgOff: 'bg-white/5',
      settingsToggleCircleBg: 'bg-[#f0f0f0]',
      settingsButtonBg: 'bg-white/[0.08]',
      settingsButtonHoverBg: 'hover:bg-white/[0.12]',
      channelTitleText: 'text-[#aaa]',
      channelCardBg: 'bg-white/[0.02]',
      channelCardHoverBg: 'hover:bg-white/[0.04]',
      channelCardSelectedBg: 'bg-white/[0.06]',
      channelCardSelectedBorder: 'border-white/20',
      channelThumbnailBorder: 'border-white/10',
      subscribeButtonBgSubscribed: 'bg-white/10',
      subscribeButtonBorderSubscribed: 'border-white/20',
      subscribeButtonTextSubscribed: 'text-white',
      subscribeButtonBgUnsubscribed: 'bg-[#111]',
      subscribeButtonBorderUnsubscribed: 'border-white/5',
      subscribeButtonTextUnsubscribed: 'text-[#555]',
      subscriptionPillBg: 'bg-white/[0.03]',
      subscriptionPillBorder: 'border-white/[0.05]',
      subscriptionPillHoverBg: 'hover:bg-white/[0.06]',
      subscriptionPillText: 'text-[#aaa]',
      videoCardBg: 'bg-white/[0.03]',
      videoCardBorder: 'border-white/[0.05]',
      videoTitleText: 'text-[#aaa]',
      videoTitleHoverText: 'group-hover:text-[#f0f0f0]',
      videoMetaText: 'text-[#555]',
      videoPlayButtonBg: 'bg-white/10',
      videoPlayButtonBorder: 'border-white/20',
      loadingSpinnerBorder: 'border-white/10',
      loadingSpinnerBorderTop: 'border-t-white/40',
      loadMoreButtonBg: 'bg-white/[0.03]',
      loadMoreButtonHoverBg: 'hover:bg-white/[0.06]',
      loadMoreButtonBorder: 'border-white/[0.08]',
      headerText: 'text-[#444]',
      divider: 'bg-white/[0.08]',
      settingsDivider: 'border-white/[0.05]',
      monochromeFilter: 'grayscale contrast-125 opacity-50',
      monochromeFilterHover: 'group-hover:grayscale-0 group-hover:contrast-100 group-hover:opacity-100',
      monochromeChannelFilterHover: 'group-hover/channel:grayscale-0 group-hover/channel:contrast-100 group-hover/channel:opacity-100',
    },
    pastel: {
      bg: 'bg-[#faf6f1]',
      text: 'text-[#5c5c5c]',
      selection: 'selection:bg-[#e0d6cc]',
      searchBoxBg: 'bg-white/60',
      searchBoxBorder: 'border-[#e8e0d5]',
      searchBoxFocusBg: 'focus-within:bg-white',
      searchBoxFocusBorder: 'focus-within:border-[#d1c4b5]',
      searchBoxShadow: 'focus-within:shadow-[0_10px_40px_rgba(0,0,0,0.02)]',
      buttonHoverBg: 'hover:bg-[#f0e8df]',
      buttonText: 'text-[#8a8a8a]',
      buttonHoverText: 'hover:text-[#5c5c5c]',
      menuBg: 'bg-[#faf6f1]/95',
      menuBorder: 'border-[#e8e0d5]',
      menuShadow: 'shadow-[0_12px_40px_rgba(0,0,0,0.05)]',
      inputPlaceholder: 'placeholder:text-[#a3a3a3]',
      settingsPanelBg: 'bg-white/60',
      settingsPanelBorder: 'border-[#e8e0d5]',
      settingsLabelText: 'text-[#8a8a8a]',
      settingsInputBg: 'bg-white',
      settingsInputBorder: 'border-[#e8e0d5]',
      settingsInputFocusBorder: 'focus:border-[#d1c4b5]',
      settingsToggleBgOn: 'bg-[#d1c4b5]',
      settingsToggleBgOff: 'bg-[#e8e0d5]',
      settingsToggleCircleBg: 'bg-white',
      settingsButtonBg: 'bg-[#f0e8df]',
      settingsButtonHoverBg: 'hover:bg-[#e0d6cc]',
      channelTitleText: 'text-[#707070]',
      channelCardBg: 'bg-white/40',
      channelCardHoverBg: 'hover:bg-white/80',
      channelCardSelectedBg: 'bg-white',
      channelCardSelectedBorder: 'border-[#d1c4b5]',
      channelThumbnailBorder: 'border-[#e8e0d5]',
      subscribeButtonBgSubscribed: 'bg-[#d1c4b5]',
      subscribeButtonBorderSubscribed: 'border-[#c2b3a3]',
      subscribeButtonTextSubscribed: 'text-white',
      subscribeButtonBgUnsubscribed: 'bg-[#f0e8df]',
      subscribeButtonBorderUnsubscribed: 'border-[#e8e0d5]',
      subscribeButtonTextUnsubscribed: 'text-[#8a8a8a]',
      subscriptionPillBg: 'bg-white/60',
      subscriptionPillBorder: 'border-[#e8e0d5]',
      subscriptionPillHoverBg: 'hover:bg-white',
      subscriptionPillText: 'text-[#707070]',
      videoCardBg: 'bg-white/40',
      videoCardBorder: 'border-[#e8e0d5]',
      videoTitleText: 'text-[#5c5c5c]',
      videoTitleHoverText: 'group-hover:text-[#333]',
      videoMetaText: 'text-[#8a8a8a]',
      videoPlayButtonBg: 'bg-white/80',
      videoPlayButtonBorder: 'border-[#e8e0d5]',
      loadingSpinnerBorder: 'border-[#e8e0d5]',
      loadingSpinnerBorderTop: 'border-t-[#a3a3a3]',
      loadMoreButtonBg: 'bg-white/60',
      loadMoreButtonHoverBg: 'hover:bg-white',
      loadMoreButtonBorder: 'border-[#e8e0d5]',
      headerText: 'text-[#a3a3a3]',
      divider: 'bg-[#e8e0d5]',
      settingsDivider: 'border-[#e8e0d5]',
      monochromeFilter: 'grayscale opacity-60',
      monochromeFilterHover: 'group-hover:grayscale-0 group-hover:opacity-100',
      monochromeChannelFilterHover: 'group-hover/channel:grayscale-0 group-hover/channel:opacity-100',
    }
  };

  const tc = themeClasses[currentAppliedTheme];

  const filteredWorkspaceCards = workspaceCards.filter(card => card.title.toLowerCase().includes(searchQuery.toLowerCase()));

  const YoutubeTutorialContent = () => (
    <div className={`space-y-4 text-[0.85rem] sm:text-[0.9rem] leading-relaxed ${tc.text} opacity-90`}>
      <p>
        Para pesquisar e assistir vídeos diretamente no <strong>Search Mini</strong>, você precisa de uma chave gratuita da <strong>YouTube Data API v3</strong>.
      </p>
      <ol className="list-decimal list-inside space-y-2 ml-2">
        <li>Acesse o <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Google Cloud Console</a>.</li>
        <li>Crie um <strong>Novo Projeto</strong> ou selecione um existente.</li>
        <li>No menu lateral, vá em <strong>APIs e Serviços</strong> &gt; <strong>Biblioteca</strong>.</li>
        <li>Pesquise por <strong>YouTube Data API v3</strong> e clique em <strong>Ativar</strong>.</li>
        <li>Vá na aba <strong>Credenciais</strong>, clique em <strong>Criar credenciais</strong> e escolha <strong>Chave de API</strong>.</li>
        <li>Copie a chave gerada e cole no painel de configurações acima (ícone de engrenagem).</li>
      </ol>
      <div className="mt-6 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-start gap-3">
        <Youtube className="w-6 h-6 text-blue-500 flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="font-semibold mb-1">Prefere um guia em vídeo?</h4>
          <p className="text-xs opacity-80 mb-2">Assista a um tutorial rápido e direto de como gerar sua chave no YouTube.</p>
          <a href="https://www.youtube.com/watch?v=tGJPSytMU5g" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-medium text-blue-500 hover:text-blue-600 transition-colors">
            Ver tutorial no YouTube <Play className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen font-sans overflow-x-hidden ${tc.bg} ${tc.text} ${tc.selection}`}>
      <input type="file" accept=".json" ref={fileInputRef} onChange={handleImportData} className="hidden" />
      <input type="file" multiple accept="image/*" ref={fileInputAiRef} onChange={handleFileAttachment} className="hidden" />
      <main className={`flex flex-col items-center p-4 relative ${isAiMode ? 'h-[100dvh] overflow-hidden pb-4' : 'min-h-screen'}`}>

        {isAiMode && (
          <div
            ref={chatContainerRef}
            onScroll={handleChatScroll}
            className="w-full max-w-3xl flex-1 overflow-y-auto mt-4 mb-4 px-2 space-y-6 flex flex-col no-scrollbar"
          >
            {chatMessages.length === 0 && (
              <div className="m-auto text-center opacity-50 flex flex-col items-center gap-4">
                <Bot className="w-12 h-12" />
                <p className="text-sm">Como posso ajudar hoje?</p>
              </div>
            )}
            {chatMessages.length > 0 && (
              <div className="flex justify-center mb-2">
                <button onClick={() => {
                  setChatSessions(prev => prev.filter(s => s.id !== currentSessionId));
                  setCurrentSessionId(null);
                }} className="text-[10px] font-bold tracking-wider opacity-50 hover:opacity-100 transition-opacity flex items-center gap-1">
                  <Trash2 className="w-3 h-3" /> Deletar Chat Atual
                </button>
              </div>
            )}
            {chatMessages.map((msg, index) => (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={index}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 ${msg.role === 'user' ? 'bg-[#8c6239] text-white rounded-br-none' : `${tc.menuBg} ${tc.menuBorder} border rounded-bl-none`}`}>
                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {msg.attachments.map((att, i) => {
                        const metaMatch = att.match(/^data:(.*?);base64,/);
                        const mimeType = metaMatch ? metaMatch[1].split(';')[0] : '';
                        const isImage = mimeType.startsWith('image/');
                        const nameParam = metaMatch ? metaMatch[1].split(';').find(p => p.startsWith('name=')) : null;
                        const fileName = nameParam ? decodeURIComponent(nameParam.split('=')[1]) : 'Arquivo';
                        const ext = fileName.split('.').pop()?.toUpperCase() || 'FILE';

                        return isImage ? (
                          <img key={i} src={att} alt="attachment" className="w-24 h-24 object-cover rounded-lg border border-white/10" />
                        ) : (
                          <div key={i} className="w-24 h-24 rounded-lg border border-white/10 bg-black/10 flex flex-col items-center justify-center p-2" title={fileName}>
                            <span className="text-xs font-bold opacity-70 mb-1">{ext}</span>
                            <span className="text-[9px] opacity-50 truncate w-full text-center">{fileName}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  <div className="whitespace-pre-wrap text-[0.9rem] leading-relaxed">
                    {renderMarkdown(msg.content)}
                  </div>
                </div>
              </motion.div>
            ))}
            {isAiLoading && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                <div className={`rounded-2xl p-4 ${tc.menuBg} ${tc.menuBorder} border rounded-bl-none flex items-center gap-2`}>
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" />
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0.15s' }} />
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0.3s' }} />
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}

        <motion.div
          layout
          className={`w-full flex justify-center z-50 ${isAiMode ? 'mt-auto mb-2' : (activeEngineId === 'youtube' || activeEngineId === 'workspace') ? 'mt-12 sm:mt-20 mb-8' : 'mt-[45vh] -translate-y-1/2 mb-0'}`}
        >
          <motion.div
            layout
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ layout: { duration: 0.7, ease: [0.25, 1, 0.5, 1] }, opacity: { duration: 0.7 }, scale: { duration: 0.7 } }}
            className="relative w-full max-w-[480px] flex flex-col items-center"
          >
            {isAiMode && attachments.length > 0 && (
              <div className={`w-full mb-3 p-3 rounded-2xl backdrop-blur-md flex gap-3 overflow-x-auto border ${tc.settingsPanelBg} ${tc.settingsPanelBorder} no-scrollbar`}>
                {attachments.map((att, i) => {
                  const metaMatch = att.match(/^data:(.*?);base64,/);
                  const mimeType = metaMatch ? metaMatch[1].split(';')[0] : '';
                  const isImage = mimeType.startsWith('image/');
                  const nameParam = metaMatch ? metaMatch[1].split(';').find(p => p.startsWith('name=')) : null;
                  const fileName = nameParam ? decodeURIComponent(nameParam.split('=')[1]) : 'Arquivo';
                  const ext = fileName.split('.').pop()?.toUpperCase() || 'FILE';

                  return (
                    <div key={i} className="relative group flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border border-gray-500/20 bg-gray-500/10 flex flex-col items-center justify-center">
                      {isImage ? (
                        <img src={att} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center p-1" title={fileName}>
                          <span className="text-[10px] font-bold opacity-70 mb-0.5">{ext}</span>
                          <span className="text-[8px] opacity-50 truncate w-full text-center">{fileName}</span>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => setAttachments(prev => prev.filter((_, idx) => idx !== i))}
                        className="absolute top-1 right-1 p-1 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/80"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="w-[90%] sm:w-[85%] flex items-center gap-2 transition-all duration-500 relative z-20 focus-within:w-full focus-within:-translate-y-0.5">
              <form
                onSubmit={executeSearch}
                className={`search-box flex-1 flex items-center rounded-[14px] px-3.5 py-2 backdrop-blur-xl transition-all duration-500 ${tc.searchBoxBg} ${tc.searchBoxBorder} ${tc.searchBoxFocusBg} ${tc.searchBoxFocusBorder} ${tc.searchBoxShadow} border`}
              >

                <div className="relative" ref={menuContainerRef}>
                  <button
                    type="button"
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all text-[0.85rem] font-medium ${tc.buttonText} ${tc.buttonHoverBg} ${tc.buttonHoverText}`}
                  >
                    <span>{isAiMode ? 'Gemini AI' : currentActiveEngine.name}</span>
                  </button>

                  <AnimatePresence>
                    {isMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: isAiMode ? 10 : -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: isAiMode ? 10 : -10 }}
                        className={`absolute ${isAiMode ? 'bottom-[calc(100%+12px)]' : 'top-[calc(100%+12px)]'} left-0 w-[200px] rounded-xl p-1.5 backdrop-blur-[25px] z-10 ${tc.menuBg} ${tc.menuBorder} ${tc.menuShadow}`}
                      >
                        <div
                          className="relative group/submenu"
                          onMouseEnter={() => setIsSubmenuOpen(true)}
                          onMouseLeave={() => setIsSubmenuOpen(false)}
                        >
                          <div className={`flex items-center justify-between px-3 py-2.5 text-[0.85rem] rounded-lg cursor-pointer ${tc.buttonText} ${tc.buttonHoverBg} ${tc.buttonHoverText}`}>
                            <span>Web Search</span>
                            <span className="text-[0.7rem] opacity-50">›</span>
                          </div>

                          <AnimatePresence>
                            {isSubmenuOpen && (
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
                                      setActiveEngineId(engine.id);
                                      setIsAiMode(false);
                                      setIsMenuOpen(false);
                                      setIsSubmenuOpen(false);
                                    }}
                                    className={`w-full flex items-center justify-between px-3 py-2 text-[0.8rem] rounded-lg transition-all ${tc.buttonHoverBg} ${activeEngineId === engine.id ? `${tc.text} font-medium` : tc.buttonText}`}
                                  >
                                    <span className="flex items-center gap-2">
                                      {engine.icon}
                                      {engine.name}
                                    </span>
                                    <span className="text-[0.6rem] opacity-50 font-semibold">{engine.shortName}</span>
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
                              setActiveEngineId(engine.id);
                              setIsAiMode(false);
                              setIsMenuOpen(false);
                            }}
                            className={`w-full flex items-center justify-between px-3 py-2.5 text-[0.85rem] rounded-lg transition-all ${tc.buttonHoverBg} ${activeEngineId === engine.id ? `${tc.text} font-medium` : tc.buttonText}`}
                          >
                            <span className="flex items-center gap-2">
                              {engine.icon}
                              {engine.name}
                            </span>
                            <span className="text-[0.7rem] opacity-50 font-semibold tracking-wider">{engine.shortName}</span>
                          </button>
                        ))}

                        <div className={`my-1 border-t ${tc.settingsDivider}`} />
                        <div
                          className="relative group/theme-submenu"
                          onMouseEnter={() => setIsThemeSubmenuOpen(true)}
                          onMouseLeave={() => setIsThemeSubmenuOpen(false)}
                        >
                          <div className={`flex items-center justify-between px-3 py-2.5 text-[0.85rem] rounded-lg cursor-pointer ${tc.buttonText} ${tc.buttonHoverBg} ${tc.buttonHoverText}`}>
                            <span>Tema</span>
                            <span className="text-[0.7rem] opacity-50">›</span>
                          </div>

                          <AnimatePresence>
                            {isThemeSubmenuOpen && (
                              <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                className={`absolute bottom-[-4px] left-[calc(100%+8px)] w-[140px] rounded-xl p-1.5 backdrop-blur-[25px] ${tc.menuBg} ${tc.menuBorder} ${tc.menuShadow}`}
                              >
                                {(['system', 'light', 'dark', 'black', 'pastel'] as ThemePreference[]).map((theme) => (
                                  <button
                                    key={theme}
                                    type="button"
                                    onClick={() => {
                                      setThemePreference(theme);
                                      setIsMenuOpen(false);
                                      setIsThemeSubmenuOpen(false);
                                    }}
                                    className={`w-full text-left px-3 py-2 text-[0.8rem] rounded-lg transition-all ${tc.buttonHoverBg} ${themePreference === theme ? `${tc.text} font-medium` : tc.buttonText}`}
                                  >
                                    {theme.charAt(0).toUpperCase() + theme.slice(1)}
                                  </button>
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        <div className={`my-1 border-t ${tc.settingsDivider}`} />
                        <div
                          className="relative group/data-submenu"
                          onMouseEnter={() => setIsDataSubmenuOpen(true)}
                          onMouseLeave={() => setIsDataSubmenuOpen(false)}
                        >
                          <div className={`flex items-center justify-between px-3 py-2.5 text-[0.85rem] rounded-lg cursor-pointer ${tc.buttonText} ${tc.buttonHoverBg} ${tc.buttonHoverText}`}>
                            <span>Data</span>
                            <span className="text-[0.7rem] opacity-50">›</span>
                          </div>

                          <AnimatePresence>
                            {isDataSubmenuOpen && (
                              <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                className={`absolute bottom-[-4px] left-[calc(100%+8px)] w-[140px] rounded-xl p-1.5 backdrop-blur-[25px] ${tc.menuBg} ${tc.menuBorder} ${tc.menuShadow}`}
                              >
                                <button
                                  type="button"
                                  onClick={handleExportData}
                                  className={`w-full text-left px-3 py-2 text-[0.8rem] rounded-lg transition-all ${tc.buttonHoverBg} ${tc.buttonText} hover:text-current`}
                                >
                                  Exportar
                                </button>
                                <button
                                  type="button"
                                  onClick={() => fileInputRef.current?.click()}
                                  className={`w-full text-left px-3 py-2 text-[0.8rem] rounded-lg transition-all ${tc.buttonHoverBg} ${tc.buttonText} hover:text-current`}
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

                {isAiMode && (
                  <button
                    type="button"
                    onClick={() => setCurrentSessionId(null)}
                    className={`flex items-center justify-center p-1.5 ml-1.5 rounded-lg transition-colors ${tc.buttonText} ${tc.buttonHoverBg} opacity-60 hover:opacity-100`}
                    title="Novo Chat"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                )}

                <div className={`w-px h-[18px] mx-2.5 ${tc.divider}`} />

                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  autoComplete="off"
                  spellCheck="false"
                  placeholder={isAiMode ? 'Digite seu prompt para a IA...' : `Pesquisar no ${currentActiveEngine.name}...`}
                  className={`flex-1 bg-transparent border-none outline-none text-[0.95rem] ${tc.text} ${tc.inputPlaceholder} placeholder:transition-opacity focus:placeholder:opacity-40 w-full`}
                />

                <div className="flex items-center ml-1 gap-1">
                  {activeEngineId === 'youtube' && youtubeApiKey && (
                    <button
                      type="button"
                      onClick={() => setYoutubeTutorialModalOpen(true)}
                      className={`flex items-center justify-center p-1.5 rounded-lg transition-colors ${tc.buttonText} ${tc.buttonHoverBg} opacity-60 hover:opacity-100`}
                      title="Ver tutorial da API"
                    >
                      <Info className="w-4 h-4" />
                    </button>
                  )}
                  {isAiMode && (
                    <button
                      type="button"
                      onClick={() => fileInputAiRef.current?.click()}
                      className={`flex items-center justify-center p-1.5 rounded-lg transition-colors ${tc.buttonText} ${tc.buttonHoverBg} opacity-60 hover:opacity-100`}
                      title="Anexar imagens"
                    >
                      <Paperclip className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsAiMode(!isAiMode)}
                    className={`flex items-center justify-center p-1.5 rounded-lg transition-colors ${isAiMode ? 'text-blue-500 bg-blue-500/10' : `${tc.buttonText} ${tc.buttonHoverBg} opacity-60 hover:opacity-100`}`}
                    title="Modo IA"
                  >
                    <Sparkles className="w-4 h-4" />
                  </button>
                </div>
              </form>

              {(activeEngineId === 'youtube' || activeEngineId === 'workspace' || isAiMode) && (
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {isAiMode && (
                    <button
                      type="button"
                      onClick={() => setShowHistoryModal(true)}
                      className={`flex items-center justify-center w-[42px] h-[42px] rounded-[14px] backdrop-blur-xl transition-all border  hover:-translate-y-0.5 ${tc.searchBoxBg} ${tc.searchBoxBorder} ${tc.buttonText} ${tc.buttonHoverBg} ${tc.buttonHoverText}`}
                      title="Histórico de Chats"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowSettingsPanel(!showSettingsPanel)}
                    className={`flex items-center justify-center w-[42px] h-[42px] rounded-[14px] backdrop-blur-xl transition-all border  hover:-translate-y-0.5 ${tc.searchBoxBg} ${tc.searchBoxBorder} ${tc.buttonText} ${tc.buttonHoverBg} ${tc.buttonHoverText}`}
                    title="Configurações"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                  {isAiMode && showScrollButton && (
                    <button
                      type="button"
                      onClick={() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })}
                      className={`flex items-center justify-center w-[42px] h-[42px] rounded-[14px] backdrop-blur-xl transition-all border shadow-sm hover:-translate-y-0.5 ${tc.searchBoxBg} ${tc.searchBoxBorder} text-blue-500 hover:bg-blue-500/10 border-blue-500/20`}
                      title="Descer para o final"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}
            </div>

            <AnimatePresence>
              {(showSettingsPanel || (activeEngineId === 'youtube' && !youtubeApiKey) || (isAiMode && !geminiApiKey)) && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="mt-6 w-full"
                >
                  <div className={`rounded-xl p-4 backdrop-blur-md space-y-4 ${tc.settingsPanelBg} ${tc.settingsPanelBorder}`}>
                    {activeEngineId === 'youtube' && (
                      <div>
                        <label className={`block text-[10px] font-semibold mb-2.5 uppercase  ${tc.settingsLabelText}`}>
                          YouTube API Key
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="password"
                            value={youtubeApiKey}
                            onChange={(event) => setYoutubeApiKey(event.target.value)}
                            placeholder="Chave v3..."
                            className={`flex-1 rounded-lg px-3 py-2 text-xs outline-none transition-colors ${tc.settingsInputBg} ${tc.settingsInputBorder} ${tc.settingsInputFocusBorder} ${tc.text}`}
                          />
                        </div>
                      </div>
                    )}

                    {isAiMode && (
                      <>
                        <div>
                          <label className={`block text-[10px] font-semibold mb-2.5 uppercase ${tc.settingsLabelText}`}>
                            Gemini API Key
                          </label>
                          <input
                            type="password"
                            value={geminiApiKey}
                            onChange={(e) => setGeminiApiKey(e.target.value)}
                            placeholder="AI Studio Key..."
                            className={`w-full rounded-lg px-3 py-2 text-xs outline-none transition-colors ${tc.settingsInputBg} ${tc.settingsInputBorder} ${tc.settingsInputFocusBorder} ${tc.text}`}
                          />
                        </div>
                        <div>
                          <label className={`block text-[10px] font-semibold mb-2.5 ${tc.settingsLabelText}`}>
                            Modelo (Ex: gemini-robotics-er-1.6-preview)
                          </label>
                          <input type="text" value={geminiModel} onChange={(e) => setGeminiModel(e.target.value)} placeholder="gemini-1.5-flash" className={`w-full rounded-lg px-3 py-2 text-xs outline-none transition-colors ${tc.settingsInputBg} ${tc.settingsInputBorder} ${tc.settingsInputFocusBorder} ${tc.text}`} />
                        </div>
                      </>
                    )}

                    <div className={`flex items-center justify-between ${activeEngineId === 'youtube' ? `pt-2 border-t ${tc.settingsDivider}` : ''}`}>
                      <label className={`text-[10px] font-semibold   ${tc.settingsLabelText}`}>
                        Modo Monocromático
                      </label>
                      <button
                        onClick={() => setIsMonochromeMode(!isMonochromeMode)}
                        className={`w-8 h-4 rounded-full transition-colors relative ${isMonochromeMode ? tc.settingsToggleBgOn : tc.settingsToggleBgOff}`}
                      >
                        <div className={`absolute top-0.5 w-3 h-3 rounded-full ${tc.settingsToggleCircleBg} transition-all ${isMonochromeMode ? 'left-[17px]' : 'left-0.5'}`} />
                      </button>
                    </div>

                    {activeEngineId === 'workspace' && (
                      <div className={`flex items-center justify-between pt-2 border-t ${tc.settingsDivider}`}>
                        <label className={`text-[10px] font-semibold   ${tc.settingsLabelText}`}>
                          Funcionar como Busca
                        </label>
                        <button
                          onClick={() => setWorkspaceSearchFallback(!workspaceSearchFallback)}
                          className={`w-8 h-4 rounded-full transition-colors relative ${workspaceSearchFallback ? tc.settingsToggleBgOn : tc.settingsToggleBgOff}`}
                        >
                          <div className={`absolute top-0.5 w-3 h-3 rounded-full ${tc.settingsToggleCircleBg} transition-all ${workspaceSearchFallback ? 'left-[17px]' : 'left-0.5'}`} />
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
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>

        {!isAiMode && activeEngineId === 'youtube' && !youtubeApiKey && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`w-full max-w-2xl mt-6 p-6 sm:p-8 rounded-3xl border ${tc.settingsPanelBg} ${tc.settingsPanelBorder} shadow-xl`}
          >
            <h2 className={`text-xl font-bold mb-6 ${tc.text} flex items-center gap-3`}>
              <Info className="w-6 h-6 text-blue-500" /> Configuração do YouTube
            </h2>
            <YoutubeTutorialContent />
          </motion.div>
        )}

        {!isAiMode && activeEngineId === 'youtube' && youtubeApiKey && (hasPerformedSearch || isViewingFeed) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full max-w-6xl mt-4"
          >
            {channelResultsList.length > 0 && (
              <div className="mb-12">
                <h4 className={`text-[10px] font-bold  tracking-[0.2em] mb-4 px-2 ${tc.headerText}`}>Canais Sugeridos</h4>
                <div className="flex gap-4 overflow-x-auto pb-4 px-2 scrollbar-hide no-scrollbar">
                  {channelResultsList.map((channel) => {
                    const isSubscribed = userSubscriptions.some(sub => sub.id === channel.id);
                    return (
                      <div key={channel.id} className="flex-shrink-0 flex flex-col items-center gap-3 group/channel relative">
                        <button
                          onClick={() => handleChannelSelection(channel.id)}
                          className={`flex flex-col items-center gap-3 p-4 rounded-2xl transition-all border ${selectedChannelId === channel.id ? `${tc.channelCardSelectedBg} ${tc.channelCardSelectedBorder}` : `${tc.channelCardBg} border-transparent ${tc.channelCardHoverBg}`}`}
                        >
                          <img
                            src={channel.thumbnail}
                            alt={channel.title}
                            className={`w-16 h-16 rounded-full object-cover border border-white/10 transition-all duration-500 ${isMonochromeMode ? `${tc.monochromeFilter} ${tc.monochromeChannelFilterHover}` : ''}`}
                            referrerPolicy="no-referrer"
                          />
                          <span className={`text-[0.75rem] font-medium max-w-[100px] truncate ${tc.channelTitleText}`}>{channel.title}</span>
                        </button>
                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            toggleChannelSubscription(channel);
                          }}
                          className={`absolute top-2 right-2 p-1.5 rounded-full backdrop-blur-md border transition-all ${isSubscribed ? `${tc.subscribeButtonBgSubscribed} ${tc.subscribeButtonBorderSubscribed} ${tc.subscribeButtonTextSubscribed}` : `${tc.subscribeButtonBgUnsubscribed} ${tc.subscribeButtonBorderUnsubscribed} ${tc.subscribeButtonTextUnsubscribed} opacity-0 group-hover/channel:opacity-100`}`}
                        >
                          <User className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {isViewingFeed && userSubscriptions.length > 0 && (
              <div className="mb-8 px-2">
                <h4 className={`text-[10px] font-bold  tracking-[0.2em] mb-4 ${tc.headerText}`}>Suas Inscrições</h4>
                <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                  {userSubscriptions.map(subscription => (
                    <button
                      key={subscription.id}
                      onClick={() => handleChannelSelection(subscription.id)}
                      className={`flex-shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-full transition-all ${tc.subscriptionPillBg} ${tc.subscriptionPillBorder} ${tc.subscriptionPillHoverBg}`}
                    >
                      <img src={subscription.thumbnail} alt={subscription.title} className="w-4 h-4 rounded-full" referrerPolicy="no-referrer" />
                      <span className={`text-[10px] ${tc.subscriptionPillText}`}>{subscription.title}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <AnimatePresence mode="popLayout">
                {videoResultsList.map((video, index) => (
                  <motion.div
                    key={video.id + index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: (index % 12) * 0.03 }}
                    onClick={() => setSelectedVideoId(video.id)}
                    className="group cursor-pointer flex flex-col h-full"
                  >
                    <div className={`relative aspect-video rounded-xl overflow-hidden mb-3 ${tc.videoCardBg} ${tc.videoCardBorder}`}>
                      <img
                        src={video.thumbnail}
                        alt={video.title}
                        className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-105 ${isMonochromeMode ? `${tc.monochromeFilter} ${tc.monochromeFilterHover}` : ''}`}
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className={`w-12 h-12 rounded-full backdrop-blur-md flex items-center justify-center ${tc.videoPlayButtonBg} ${tc.videoPlayButtonBorder}`}>
                          <Play className={`w-5 h-5 ${currentAppliedTheme === 'dark' ? 'fill-white' : 'fill-gray-800'}`} />
                        </div>
                      </div>
                    </div>
                    <div className="px-1 flex flex-col flex-1">
                      <h3 className={`text-[0.95rem] font-semibold line-clamp-2 transition-colors leading-snug mb-2 ${tc.videoTitleText} ${tc.videoTitleHoverText}`} dangerouslySetInnerHTML={{ __html: video.title }} />
                      <div className={`flex flex-wrap items-center gap-x-3 gap-y-1 mt-auto text-[11px] font-medium opacity-80 ${tc.videoMetaText}`}>
                        <span className="truncate flex items-center gap-1"><User className="w-3.5 h-3.5" /> {video.channelTitle}</span>
                        <span className="opacity-40">•</span>
                        <span className="flex items-center gap-1 flex-shrink-0"><Clock className="w-3.5 h-3.5" /> {new Date(video.publishedAt).toLocaleDateString('pt-BR')}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {isContentLoading && (
              <div className="flex justify-center mt-12">
                <div className={`w-6 h-6 border-2 rounded-full animate-spin ${tc.loadingSpinnerBorder} ${tc.loadingSpinnerBorderTop}`} />
              </div>
            )}

            {nextPageToken && !isContentLoading && (
              <div className="mt-16 flex justify-center">
                <button
                  onClick={loadMoreVideos}
                  className={`px-8 py-3 rounded-full text-[11px] font-bold tracking-[0.2em]  transition-all hover:scale-105 active:scale-95 ${tc.loadMoreButtonBg} ${tc.loadMoreButtonHoverBg} ${tc.loadMoreButtonBorder}`}
                >
                  Mostrar Mais
                </button>
              </div>
            )}
          </motion.div>
        )}

        {!isAiMode && activeEngineId === 'workspace' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full max-w-6xl mt-4"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <AnimatePresence mode="popLayout">
                {filteredWorkspaceCards.map((card, index) => (
                  <motion.div
                    key={card.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: (index % 12) * 0.03 }}
                    className="group relative cursor-pointer"
                    onClick={() => { if (card.url) window.open(card.url, '_blank', 'noopener,noreferrer'); }}
                  >
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
                      <h3 className={`text-[0.85rem] font-medium truncate ${tc.videoTitleText} ${tc.videoTitleHoverText}`}>
                        {card.title}
                      </h3>
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
        )}
      </main>

      <VideoModal selectedVideoId={selectedVideoId} onClose={() => setSelectedVideoId(null)} />

      <AnimatePresence>
        {workspaceModalOpen && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setWorkspaceModalOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`relative w-full max-w-md rounded-2xl p-6 shadow-2xl ${tc.menuBg} ${tc.menuBorder}`}
              onClick={e => e.stopPropagation()}
            >
              <h2 className={`text-lg font-bold mb-4 ${tc.text}`}>Configurar Card</h2>
              <div className="space-y-4">
                <div>
                  <label className={`block text-[10px] font-semibold mb-1.5  tracking-wider ${tc.settingsLabelText}`}>Nome</label>
                  <input type="text" value={cardFormData.title} onChange={e => setCardFormData({ ...cardFormData, title: e.target.value })} className={`w-full rounded-lg px-3 py-2 text-sm outline-none transition-colors ${tc.settingsInputBg} ${tc.settingsInputBorder} ${tc.settingsInputFocusBorder} ${tc.text}`} />
                </div>
                <div>
                  <label className={`block text-[10px] font-semibold mb-1.5  tracking-wider ${tc.settingsLabelText}`}>URL do Site</label>
                  <input
                    type="text"
                    value={cardFormData.url}
                    onChange={e => setCardFormData({ ...cardFormData, url: e.target.value })}
                    onBlur={() => {
                      if (!cardFormData.icon && cardFormData.url) {
                        try {
                          let checkUrl = cardFormData.url;
                          if (!checkUrl.startsWith('http')) checkUrl = 'https://' + checkUrl;
                          const hostname = new URL(checkUrl).hostname;
                          setCardFormData(prev => ({ ...prev, icon: `https://www.google.com/s2/favicons?domain=${hostname}&sz=128` }));
                        } catch (e) {
                          // Ignora URL inválida
                        }
                      }
                    }}
                    placeholder="https://..."
                    className={`w-full rounded-lg px-3 py-2 text-sm outline-none transition-colors ${tc.settingsInputBg} ${tc.settingsInputBorder} ${tc.settingsInputFocusBorder} ${tc.text}`}
                  />
                </div>
                <div>
                  <label className={`block text-[10px] font-semibold mb-1.5  tracking-wider ${tc.settingsLabelText}`}>Ícone (URL PNG/JPG)</label>
                  <input type="text" value={cardFormData.icon} onChange={e => setCardFormData({ ...cardFormData, icon: e.target.value })} className={`w-full rounded-lg px-3 py-2 text-sm outline-none transition-colors ${tc.settingsInputBg} ${tc.settingsInputBorder} ${tc.settingsInputFocusBorder} ${tc.text}`} />
                </div>
                <div>
                  <label className={`block text-[10px] font-semibold mb-1.5  tracking-wider ${tc.settingsLabelText}`}>Imagem (URL PNG/JPG)</label>
                  <input type="text" value={cardFormData.image} onChange={e => setCardFormData({ ...cardFormData, image: e.target.value })} className={`w-full rounded-lg px-3 py-2 text-sm outline-none transition-colors ${tc.settingsInputBg} ${tc.settingsInputBorder} ${tc.settingsInputFocusBorder} ${tc.text}`} />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button onClick={() => { setWorkspaceCards(workspaceCards.filter(c => c.id !== editingCardId)); setWorkspaceModalOpen(false); }} className="px-4 py-2 rounded-lg text-xs font-medium text-red-500 hover:bg-red-500/10 transition-colors">Remover</button>
                <button onClick={() => setWorkspaceModalOpen(false)} className={`px-4 py-2 rounded-lg text-xs font-medium ${tc.buttonText} ${tc.buttonHoverBg} transition-colors`}>Cancelar</button>
                <button onClick={() => { setWorkspaceCards(workspaceCards.map(c => c.id === editingCardId ? { ...c, ...cardFormData } : c)); setWorkspaceModalOpen(false); }} className="px-4 py-2 rounded-lg text-xs font-medium bg-zinc-700 text-white hover:bg-zinc-600 transition-colors">Salvar</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {exportDataModalOpen && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setExportDataModalOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`relative w-full max-w-2xl rounded-2xl p-6 shadow-2xl ${tc.menuBg} ${tc.menuBorder}`}
              onClick={e => e.stopPropagation()}
            >
              <h2 className={`text-lg font-bold mb-4 ${tc.text}`}>Exportar Dados</h2>
              <div className="space-y-4">
                <textarea
                  value={exportDataJson}
                  readOnly
                  className={`w-full h-64 rounded-lg px-3 py-2 text-sm outline-none transition-colors resize-none font-mono ${tc.settingsInputBg} ${tc.settingsInputBorder} ${tc.settingsInputFocusBorder} ${tc.text}`}
                />
              </div>
              <div className="flex justify-between items-center mt-6">
                <button
                  onClick={() => {
                    const blob = new Blob([exportDataJson], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.style.display = 'none';
                    a.href = url;
                    a.download = 'search-mini-backup.json';
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    setTimeout(() => URL.revokeObjectURL(url), 1500);
                  }}
                  className="p-2.5 rounded-lg text-xs font-medium bg-zinc-700 text-white hover:bg-zinc-600 transition-colors flex items-center justify-center"
                  title="Download JSON"
                >
                  <Download className="w-5 h-5" />
                </button>
                <div className="flex gap-2">
                  <button onClick={() => navigator.clipboard.writeText(exportDataJson)} className={`px-4 py-2 rounded-lg text-xs font-medium ${tc.buttonText} ${tc.buttonHoverBg} transition-colors`}>Copiar</button>
                  <button onClick={() => setExportDataModalOpen(false)} className={`px-4 py-2 rounded-lg text-xs font-medium ${tc.buttonText} ${tc.buttonHoverBg} transition-colors`}>Fechar</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {youtubeTutorialModalOpen && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setYoutubeTutorialModalOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`relative w-full max-w-2xl rounded-2xl p-6 shadow-2xl ${tc.menuBg} ${tc.menuBorder}`}
              onClick={e => e.stopPropagation()}
            >
              <h2 className={`text-lg font-bold mb-4 ${tc.text} flex items-center gap-2`}>
                <Info className="w-5 h-5 text-blue-500" /> Tutorial: Chave de API do YouTube
              </h2>
              <YoutubeTutorialContent />
              <div className="flex justify-end mt-6">
                <button onClick={() => setYoutubeTutorialModalOpen(false)} className={`px-4 py-2 rounded-lg text-xs font-medium ${tc.buttonText} ${tc.buttonHoverBg} transition-colors`}>Fechar</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showHistoryModal && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowHistoryModal(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`relative w-full max-w-4xl max-h-[80vh] flex flex-col rounded-2xl p-6 shadow-2xl ${tc.menuBg} ${tc.menuBorder} border`}
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className={`text-lg font-bold ${tc.text}`}>Histórico de Chats</h2>
                <button onClick={() => setShowHistoryModal(false)} className={`${tc.buttonText} hover:text-white transition-colors`}>
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto pr-2 no-scrollbar">
                {chatSessions.map(session => (
                  <div
                    key={session.id}
                    onClick={() => { setCurrentSessionId(session.id); setIsAiMode(true); setShowHistoryModal(false); }}
                    className={`group relative p-4 rounded-xl cursor-pointer border transition-all hover:scale-[1.02] ${currentSessionId === session.id ? 'border-[#8c6239]/50 bg-[#8c6239]/10' : `${tc.settingsPanelBorder} ${tc.settingsPanelBg} hover:border-[#8c6239]/30`}`}
                  >
                    <h3 className={`font-medium text-sm truncate mb-2 ${tc.text}`}>{session.title}</h3>
                    <p className="text-xs opacity-50 flex items-center justify-between">
                      <span>{new Date(session.updatedAt).toLocaleDateString()}</span>
                      <span>{new Date(session.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </p>
                    <p className="text-xs opacity-40 mt-2 truncate">{session.messages.length} mensagens</p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setChatSessions(prev => prev.filter(s => s.id !== session.id));
                        if (currentSessionId === session.id) setCurrentSessionId(null);
                      }}
                      className="absolute top-2 right-2 p-1.5 opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-500 rounded-md hover:bg-red-500/10"
                      title="Deletar Chat"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                {chatSessions.length === 0 && <div className={`col-span-full text-center py-12 opacity-50 ${tc.text}`}>Nenhum chat anterior encontrado.</div>}
              </div>
              {chatSessions.length > 0 && (
                <div className={`mt-6 pt-4 border-t flex justify-end ${tc.settingsDivider}`}>
                  <button
                    onClick={() => {
                      if (window.confirm('Tem certeza que deseja apagar todo o histórico de conversas?')) {
                        setChatSessions([]);
                        setCurrentSessionId(null);
                      }
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-red-500/70 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Limpar Histórico
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`
        @import url("https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css");
        :root { font-family: 'Pretendard', sans-serif; }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
