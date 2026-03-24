import Anthropic from '@anthropic-ai/sdk'
import { buildTasteProfile } from './preferenceService.js'
import { searchMovies, getTrending, getMovieDetails, getSimilarMovies } from './tmdbService.js'
import { getImdbData } from './omdbService.js'
import LibraryItem from '../models/LibraryItem.js'

const client = new Anthropic()

const tools = [
  {
    name: 'get_user_watch_history',
    description: "Fetch the user's recently watched movies with their personal ratings",
    input_schema: {
      type: 'object',
      properties: {
        userId: { type: 'string', description: 'The user clerkId' },
        limit: { type: 'number', description: 'Number of items to fetch (default 20)' }
      },
      required: ['userId']
    }
  },
  {
    name: 'get_user_taste_profile',
    description: 'Return aggregated genre preferences, top genres, and avg rating built from watch history',
    input_schema: {
      type: 'object',
      properties: {
        userId: { type: 'string', description: 'The user clerkId' }
      },
      required: ['userId']
    }
  },
  {
    name: 'search_movies',
    description: 'Search TMDB for movies by keyword, genre name, mood, year range, or minimum rating',
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Free text search query' },
        genre: { type: 'string', description: 'TMDB genre ID (28=Action, 35=Comedy, 18=Drama, 27=Horror, 878=Sci-Fi, 53=Thriller, 10749=Romance, 16=Animation, 99=Documentary)' },
        yearFrom: { type: 'number', description: 'Earliest release year' },
        yearTo: { type: 'number', description: 'Latest release year' },
        minRating: { type: 'number', description: 'Minimum TMDB vote average (0-10)' },
        language: { type: 'string', description: 'ISO 639-1 language code (en, fr, ja, ko, es...)' }
      }
    }
  },
  {
    name: 'get_trending_movies',
    description: 'Fetch currently trending or popular movies',
    input_schema: {
      type: 'object',
      properties: {
        timeWindow: { type: 'string', enum: ['day', 'week'], description: 'Trending window' }
      }
    }
  },
  {
    name: 'get_movie_details',
    description: 'Get full metadata for a movie including IMDB rating, cast, runtime, streaming info',
    input_schema: {
      type: 'object',
      properties: {
        tmdbId: { type: 'number', description: 'TMDB movie ID' }
      },
      required: ['tmdbId']
    }
  },
  {
    name: 'filter_unwatched',
    description: "Remove movies the user has already watched. ALWAYS call this before finalising picks.",
    input_schema: {
      type: 'object',
      properties: {
        userId: { type: 'string', description: 'The user clerkId' },
        tmdbIds: { type: 'array', items: { type: 'number' }, description: 'List of TMDB IDs to filter' }
      },
      required: ['userId', 'tmdbIds']
    }
  },
  {
    name: 'get_similar_movies',
    description: 'Find movies similar to a given TMDB movie ID',
    input_schema: {
      type: 'object',
      properties: {
        tmdbId: { type: 'number', description: 'TMDB movie ID to find similar movies for' }
      },
      required: ['tmdbId']
    }
  },
  {
    name: 'get_group_taste_overlap',
    description: 'For a group marathon, find genre preferences shared across all members',
    input_schema: {
      type: 'object',
      properties: {
        memberIds: { type: 'array', items: { type: 'string' }, description: 'Array of clerkIds' }
      },
      required: ['memberIds']
    }
  }
]

async function executeTool(name, input) {
  switch (name) {
    case 'get_user_watch_history': {
      const limit = input.limit || 20
      const items = await LibraryItem.find(
        { clerkId: input.userId, status: { $in: ['watched', 'rewatching'] } },
        { tmdbId: 1, title: 1, userRating: 1, genres: 1, watchedAt: 1 }
      ).sort({ watchedAt: -1 }).limit(limit)
      return items
    }

    case 'get_user_taste_profile': {
      return await buildTasteProfile(input.userId)
    }

    case 'search_movies': {
      const results = await searchMovies(input)
      return results.results?.slice(0, 15).map(m => ({
        tmdbId: m.id,
        title: m.title,
        year: m.release_date?.slice(0, 4),
        rating: m.vote_average,
        overview: m.overview?.slice(0, 150)
      }))
    }

    case 'get_trending_movies': {
      const results = await getTrending(input.timeWindow || 'week')
      return results.slice(0, 10).map(m => ({
        tmdbId: m.id,
        title: m.title,
        year: m.release_date?.slice(0, 4),
        rating: m.vote_average
      }))
    }

    case 'get_movie_details': {
      const details = await getMovieDetails(input.tmdbId)
      const imdb = details.imdbId ? await getImdbData(details.imdbId) : null
      return {
        tmdbId: details.id,
        title: details.title,
        overview: details.overview,
        runtime: details.runtime,
        genres: details.genres?.map(g => g.name),
        imdbRating: imdb?.imdbRating,
        tmdbRating: details.vote_average,
        cast: details.cast?.slice(0, 5).map(c => c.name),
        director: details.crew?.find(c => c.job === 'Director')?.name,
        year: details.release_date?.slice(0, 4),
        posterPath: details.poster_path
      }
    }

    case 'filter_unwatched': {
      const watched = await LibraryItem.find(
        { clerkId: input.userId, tmdbId: { $in: input.tmdbIds }, status: { $in: ['watched', 'rewatching', 'dropped'] } },
        { tmdbId: 1 }
      )
      const watchedIds = new Set(watched.map(w => w.tmdbId))
      return input.tmdbIds.filter(id => !watchedIds.has(id))
    }

    case 'get_similar_movies': {
      const results = await getSimilarMovies(input.tmdbId)
      return results.slice(0, 10).map(m => ({
        tmdbId: m.id,
        title: m.title,
        year: m.release_date?.slice(0, 4),
        rating: m.vote_average
      }))
    }

    case 'get_group_taste_overlap': {
      const profiles = await Promise.all(input.memberIds.map(id => buildTasteProfile(id)))
      const allGenres = profiles.flatMap(p => p.topGenres || [])
      const genreCount = {}
      for (const g of allGenres) genreCount[g] = (genreCount[g] || 0) + 1
      const sharedGenres = Object.entries(genreCount)
        .sort((a, b) => b[1] - a[1])
        .filter(([, count]) => count > 1)
        .slice(0, 3)
        .map(([genre]) => genre)
      return { sharedGenres, memberCount: input.memberIds.length }
    }

    default:
      return { error: `Unknown tool: ${name}` }
  }
}

export async function runAgentRecommendation({ message, userId, moodParams, isGroupPick, memberIds, isBlindPick }) {
  const systemPrompt = `You are CineAI, an expert personal movie curator with encyclopedic film knowledge.

Rules you MUST follow:
1. ALWAYS call get_user_taste_profile first to understand the user's taste
2. ALWAYS call filter_unwatched before finalising any picks — never recommend already-watched films
3. Recommend exactly 3 movies unless the user asks for more/less
4. Give a personalised one-sentence reason for EACH pick that references their specific taste
5. ${isGroupPick ? 'This is a GROUP PICK — use get_group_taste_overlap to find shared preferences across all members' : ''}
6. ${isBlindPick ? 'BLIND PICK MODE — return picks but set blindMode:true so the frontend hides title/poster until revealed' : ''}

Return your final answer as valid JSON ONLY (no markdown, no explanation outside JSON):
{
  "picks": [
    {
      "tmdbId": number,
      "title": string,
      "year": string,
      "reason": string,
      "imdbRating": number | null,
      "runtime": number | null,
      "posterPath": string | null
    }
  ],
  "blindMode": boolean,
  "agentThought": string  // brief summary of your reasoning process
}`

  const messages = [{ role: 'user', content: message || 'Pick me a movie to watch tonight' }]
  if (moodParams) {
    messages[0].content += ` [Mood params: tone=${moodParams.tone}, pace=${moodParams.pace}, familiarity=${moodParams.familiarity}]`
  }
  if (isGroupPick && memberIds) {
    messages[0].content += ` [GROUP PICK for members: ${memberIds.join(', ')}]`
  }

  let response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    system: systemPrompt,
    tools,
    messages: [{ role: 'user', content: `User ID: ${userId}\n\n${messages[0].content}` }]
  })

  // Agentic loop — keep going until Claude stops using tools
  const conversationMessages = [{ role: 'user', content: `User ID: ${userId}\n\n${messages[0].content}` }]

  while (response.stop_reason === 'tool_use') {
    const toolUseBlocks = response.content.filter(b => b.type === 'tool_use')
    conversationMessages.push({ role: 'assistant', content: response.content })

    const toolResults = await Promise.all(
      toolUseBlocks.map(async block => ({
        type: 'tool_result',
        tool_use_id: block.id,
        content: JSON.stringify(await executeTool(block.name, block.input))
      }))
    )

    conversationMessages.push({ role: 'user', content: toolResults })

    response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: systemPrompt,
      tools,
      messages: conversationMessages
    })
  }

  // Extract the JSON response
  const textBlock = response.content.find(b => b.type === 'text')
  if (!textBlock) throw new Error('No text response from agent')

  try {
    // Strip any markdown code fences if present
    const cleaned = textBlock.text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    return JSON.parse(cleaned)
  } catch {
    throw new Error('Agent returned invalid JSON: ' + textBlock.text.slice(0, 200))
  }
}
