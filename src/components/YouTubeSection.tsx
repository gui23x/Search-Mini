import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Clock, Play } from 'lucide-react';
import { VideoResult, ChannelResult, Subscription } from '../types';

interface YouTubeSectionProps {
  tc: any; isMonochromeMode: boolean; currentAppliedTheme: string; channelResultsList: ChannelResult[];
  videoResultsList: VideoResult[]; userSubscriptions: Subscription[]; isViewingFeed: boolean;
  selectedChannelId: string | null; isContentLoading: boolean; nextPageToken: string | null;
  handleChannelSelection: (id: string) => void; toggleChannelSubscription: (ch: Subscription) => void;
  setSelectedVideoId: (id: string | null) => void; loadMoreVideos: () => void;
}

/**
 * Seção para exibição do Feed de inscritos, canais sugeridos e busca de vídeos no YouTube
 */
export const YouTubeSection: React.FC<YouTubeSectionProps> = ({
  tc, isMonochromeMode, currentAppliedTheme, channelResultsList, videoResultsList, userSubscriptions,
  isViewingFeed, selectedChannelId, isContentLoading, nextPageToken, handleChannelSelection,
  toggleChannelSubscription, setSelectedVideoId, loadMoreVideos
}) => {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full max-w-6xl mt-4">
      {channelResultsList.length > 0 && (
        <div className="mb-12">
          <h4 className={`text-[10px] font-bold tracking-[0.2em] mb-4 px-2 ${tc.headerText}`}>Canais Sugeridos</h4>
          <div className="flex gap-4 overflow-x-auto pb-4 px-2 no-scrollbar">
            {channelResultsList.map((channel) => {
              const isSubscribed = userSubscriptions.some(sub => sub.id === channel.id);
              return (
                <div key={channel.id} className="flex-shrink-0 flex flex-col items-center gap-3 group/channel relative">
                  <button onClick={() => handleChannelSelection(channel.id)} className={`flex flex-col items-center gap-3 p-4 rounded-2xl transition-all border ${selectedChannelId === channel.id ? `${tc.channelCardSelectedBg} ${tc.channelCardSelectedBorder}` : `${tc.channelCardBg} border-transparent ${tc.channelCardHoverBg}`}`}>
                    <img src={channel.thumbnail} alt={channel.title} className={`w-16 h-16 rounded-full object-cover border border-white/10 transition-all duration-500 ${isMonochromeMode ? `${tc.monochromeFilter} ${tc.monochromeChannelFilterHover}` : ''}`} referrerPolicy="no-referrer" />
                    <span className={`text-[0.75rem] font-medium max-w-[100px] truncate ${tc.channelTitleText}`}>{channel.title}</span>
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); toggleChannelSubscription(channel); }} className={`absolute top-2 right-2 p-1.5 rounded-full backdrop-blur-md border transition-all ${isSubscribed ? `${tc.subscribeButtonBgSubscribed} ${tc.subscribeButtonBorderSubscribed} ${tc.subscribeButtonTextSubscribed}` : `${tc.subscribeButtonBgUnsubscribed} ${tc.subscribeButtonBorderUnsubscribed} ${tc.subscribeButtonTextUnsubscribed} opacity-0 group-hover/channel:opacity-100`}`}>
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
          <h4 className={`text-[10px] font-bold tracking-[0.2em] mb-4 ${tc.headerText}`}>Suas Inscrições</h4>
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
            {userSubscriptions.map(sub => (
              <button key={sub.id} onClick={() => handleChannelSelection(sub.id)} className={`flex-shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-full transition-all ${tc.subscriptionPillBg} ${tc.subscriptionPillBorder} ${tc.subscriptionPillHoverBg}`}>
                <img src={sub.thumbnail} alt={sub.title} className="w-4 h-4 rounded-full" referrerPolicy="no-referrer" />
                <span className={`text-[10px] ${tc.subscriptionPillText}`}>{sub.title}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <AnimatePresence mode="popLayout">
          {videoResultsList.map((video, index) => (
            <motion.div key={video.id + index} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: (index % 12) * 0.03 }} onClick={() => setSelectedVideoId(video.id)} className="group cursor-pointer flex flex-col h-full">
              <div className={`relative aspect-video rounded-xl overflow-hidden mb-3 ${tc.videoCardBg} ${tc.videoCardBorder}`}>
                <img src={video.thumbnail} alt={video.title} className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-105 ${isMonochromeMode ? `${tc.monochromeFilter} ${tc.monochromeFilterHover}` : ''}`} referrerPolicy="no-referrer" />
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
          <button onClick={loadMoreVideos} className={`px-8 py-3 rounded-full text-[11px] font-bold tracking-[0.2em] transition-all hover:scale-105 active:scale-95 ${tc.loadMoreButtonBg} ${tc.loadMoreButtonHoverBg} ${tc.loadMoreButtonBorder}`}>
            Mostrar Mais
          </button>
        </div>
      )}
    </motion.div>
  );
};
