export interface VideoResult {
    id: string;
    title: string;
    thumbnail: string;
    publishedAt: string;
    channelTitle: string;
    channelId: string;
}

export interface ChannelResult {
    id: string;
    title: string;
    thumbnail: string;
}

export interface Subscription {
    id: string;
    title: string;
    thumbnail: string;
}

export interface SearchEngine {
    id: string;
    name: string;
    url: string;
    icon: React.ReactNode;
}

export interface WorkspaceCard {
    id: string;
    title: string;
    url: string;
    icon: string;
    image: string;
}
