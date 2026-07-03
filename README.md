<div align="center">
  <!-- Placeholder for the project cover image -->
<img alt="GHBanner" src="https://i.pinimg.com/originals/9f/85/14/9f85149150ad9e9be7642971bde762b6.png" />

  <br>

  # YouTube Search Hub (Search Mini)
  
  *A modern, minimal search engine hub with integrated YouTube video discovery, seamless playback, and multi-engine web search.*
</div>

## 🌟 Overview

Search Mini is a highly customizable, centralized search dashboard built with React and Tailwind CSS. It allows you to search across multiple web engines (Google, DuckDuckGo, Brave, Bing, GitHub) from a single, beautifully designed interface. 

Beyond traditional search, it acts as a **YouTube client**—letting you discover videos, subscribe to channels locally, and watch content in a distraction-free modal. Additionally, it features a **Workspace mode** to manage your favorite bookmarks directly from the search bar.

## ✨ Features

*   **Multi-Engine Search**: Switch between Google, DuckDuckGo, Brave, Bing, and GitHub instantly.
*   **Integrated YouTube Experience**:
    *   Search for videos and channels directly.
    *   Watch videos seamlessly in a custom popup modal.
    *   Locally subscribe to channels and view a chronological feed of their latest releases.
    *   Automatically filters out YouTube Shorts for a cleaner video feed.
*   **Workspace Bookmarks**:
    *   Use the `add: [Site Name]` command in the Workspace engine to quickly create custom shortcut cards.
    *   Fallback search: If a query isn't an "add:" command, it automatically redirects to your default web search.
*   **Deep Customization**:
    *   Multiple color themes: System, Light, Dark, True Black, and Pastel.
    *   **Monochrome Mode**: Toggle grayscale thumbnails for a minimalist aesthetic.
*   **Data Portability**: Export and import all your settings, subscriptions, and Workspace cards as a single JSON file.

## 🚀 How It Works

1. **Search Bar**: Type your query and hit Enter. The action depends on the currently selected engine.
2. **Engine Switcher**: Click the button on the left side of the search bar to reveal a dropdown menu and switch your active search engine.
3. **Settings**: Click the gear icon `<Settings>` (available when YouTube or Workspace is selected) to configure your YouTube API Key, toggle Monochrome mode, or adjust Workspace fallback behavior.
4. **Workspace Commands**: While in the Workspace engine, type `add: My Bookmark` to instantly generate a bookmark card. You can click the gear icon on the card to edit its URL, icon, or image.
5. **Data Management**: Open the Engine Switcher menu, hover over **Data**, and choose Export or Import to backup your configurations.

## 💻 Run Locally

**Prerequisites:** 
* Node.js (v16+ recommended)
* A YouTube Data API v3 Key (for YouTube features)

### Installation

1. **Clone the repository and install dependencies:**
   ```bash
   npm install
   ```

2. **Environment Configuration:**
   Create a `.env` or `.env.local` file in the root directory and add your API keys:
   ```env
   VITE_YOUTUBE_API_KEY=your_youtube_api_key_here
   ```
   *Note: You can also add your YouTube API Key directly via the Settings panel inside the app's UI.*

3. **Run the development server:**
   ```bash
   npm run dev
   ```

4. **Build for production:**
   ```bash
   npm run build
   ```


## 🛠️ Tech Stack

*   **Framework**: React (with Vite)
*   **Styling**: Tailwind CSS
*   **Icons**: Lucide React
*   **Animations**: Framer Motion
*   **Data Fetching**: Native Fetch API (YouTube Data API v3)
*   **Storage**: Browser LocalStorage for persistence

---
*Built by the Search Mini Team.*
