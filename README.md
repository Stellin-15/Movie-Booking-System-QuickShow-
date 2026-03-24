# CineAI — Agentic Movie Social Platform

> Think Letterboxd meets Spotify meets TikTok, with a genuine AI agent at the core.

CineAI is a social-first, AI-powered movie platform where a Claude-powered agent picks movies specifically for you based on your watch history and mood. Discover films, build a personal library, write reviews, share curated CineLists, plan movie marathons with friends, and scroll a live social feed — all in one place.

---

## Features

### 🤖 CineAI Agent
- Conversational AI that analyses your watch history before recommending
- Multi-step tool use: checks your taste profile → searches TMDB → filters out watched films → fetches IMDB ratings → explains each pick personally
- **Mood prompts** — "Something intense", "Make me laugh", "90 min max", "Surprise me"
- **Blind Pick Mode** — AI picks a movie but hides the title until you commit
- **Double Feature** — AI finds two films that pair thematically
- **Group Pick** — finds a movie the whole marathon room will enjoy
- Free tier: 5 AI picks/day · Pro: unlimited

### 🎬 Movie Discovery
- Live data from TMDB — trending, popular, search, genre filters
- IMDB ratings via OMDb API alongside TMDB community scores
- Rotten Tomatoes, Metascore, box office, awards on every movie page
- Cast row, trailer embed, streaming availability (where to watch)
- Full review system with spoiler tags, star ratings, and reaction likes

### 📚 Personal Library
- 5 statuses: Watched · Watchlist · Watching · Rewatching · Dropped
- Half-star personal ratings (0.5–5)
- Private diary notes per film
- Rewatch counter + watch date tracking
- Taste DNA — radar chart of your genre preferences
- **Annual Wrapped** — Spotify-style year-in-film recap every December

### 👥 Social
- Follow/follower graph with mutual-friend detection
- Taste Compatibility Score — % overlap between any two users
- Activity feed — friends' watches, reviews, and new lists in a scrollable timeline
- Movie news sidebar — trailers and announcements from NewsAPI
- Friend suggestions based on genre preference match

### 🎵 CineLists *(Spotify Albums for Movies)*
- Create ranked or unranked movie playlists with cover art
- Collaborative lists — invite friends to co-edit
- Challenge lists — track your completion %
- Fork anyone's public list and make it your own
- Save count, fork count, shareable link

### 🏃 Movie Marathon Rooms
- Host a room → share a 6-character code with friends
- Everyone nominates movies, then votes simultaneously
- Live bracket voting with real-time Socket.io updates
- Live chat sidebar during the room
- AI can suggest a group pick based on everyone's taste

### 🏆 Gamification
- Badges: Century Club, Genre Master, Early Bird, Streak 7, List Maker, Social Butterfly, Contrarian
- Watch streaks
- Annual Wrapped shareable card

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + Vite + Tailwind CSS v4 |
| Auth | Clerk (sign up, sign in, password reset, social login) |
| Client State | Zustand |
| Backend | Node.js + Express |
| Database | MongoDB + Mongoose |
| Real-time | Socket.io |
| AI Agent | Claude API (`claude-sonnet-4-6`) with tool use |
| Movie Data | TMDB API |
| IMDB Ratings | OMDb API |
| Movie News | NewsAPI |
| Payments | Stripe (Pro subscription) |

---

## Project Structure

```
Movie Booking System-01/
├── client/          React frontend (Vite)
│   └── src/
│       ├── api/             API client functions
│       ├── components/      Reusable UI components
│       │   ├── chat/        CineAI chat components
│       │   ├── social/      Review cards, user cards
│       │   └── ui/          StarRating, StatusBadge, GenrePill
│       ├── pages/           Route-level page components
│       └── stores/          Zustand state stores
│
└── server/          Express backend
    ├── models/      Mongoose schemas
    ├── routes/      REST API endpoints
    ├── services/    TMDB, OMDb, Claude agent, news, Stripe
    ├── sockets/     Socket.io marathon room logic
    └── middleware/  Clerk JWT auth
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (free tier works)
- API keys (see below)

### 1. Clone & Install

```bash
# Install client dependencies
cd "Movie Booking System-01/client"
npm install

# Install server dependencies
cd ../server
npm install
```

### 2. Configure Environment Variables

Copy the example and fill in your keys:

```bash
cp "Movie Booking System-01/server/.env.example" "Movie Booking System-01/server/.env"
```

| Variable | Where to get it |
|---|---|
| `MONGODB_URI` | [mongodb.com/atlas](https://mongodb.com/atlas) → free cluster |
| `CLERK_SECRET_KEY` | [clerk.com](https://clerk.com) → API Keys |
| `TMDB_API_KEY` | [themoviedb.org/settings/api](https://www.themoviedb.org/settings/api) → free |
| `OMDB_API_KEY` | [omdbapi.com](https://www.omdbapi.com/apikey.aspx) → free tier |
| `ANTHROPIC_API_KEY` | [console.anthropic.com](https://console.anthropic.com) |
| `NEWS_API_KEY` | [newsapi.org](https://newsapi.org) → free tier |
| `STRIPE_SECRET_KEY` | [stripe.com](https://stripe.com) → test mode |

The client `.env` already has the Clerk publishable key. Just add:

```env
# Movie Booking System-01/client/.env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...   # already set
VITE_API_BASE_URL=http://localhost:5000
```

### 3. Run

```bash
# Terminal 1 — backend (port 5000)
cd "Movie Booking System-01/server"
npm run dev

# Terminal 2 — frontend (port 5173)
cd "Movie Booking System-01/client"
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## Monetization

| Tier | Details |
|---|---|
| **Free** | 5 AI picks/day, library up to 500 films, 3 CineLists |
| **CineAI Pro — $5.99/mo** | Unlimited AI picks, all agent modes, unlimited library + lists, ad-free, Annual Wrapped export |
| **Affiliate links** | Passive revenue from "Where to Watch" streaming buttons (JustWatch / Amazon) |
| **Studio ad placements** | Sponsored picks in feed and featured CineLists (B2B) |
| **Creator economy** | Film Club subscriptions with 15% platform cut (coming soon) |

---

## API Keys — Free Tier Limits

| Service | Free Tier |
|---|---|
| TMDB | Unlimited (rate limited) |
| OMDb | 1,000 requests/day |
| NewsAPI | 100 requests/day (dev mode) |
| Anthropic | Pay per token |
| Clerk | 10,000 MAU free |
| Stripe | No monthly fee (% per transaction) |

---

## Roadmap

- [ ] JustWatch integration for real-time streaming availability
- [ ] Oscar prediction game
- [ ] Box Office Fantasy League
- [ ] Verified Critic badges
- [ ] Annual Wrapped shareable image export
- [ ] Mobile app (React Native)
