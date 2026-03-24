import React, { useState, useRef, useEffect } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { Send, Sparkles, Shuffle, Film, Clock, Zap, Crown } from 'lucide-react'
import { recommend, getUsage } from '../api/agent'
import MovieSuggestion from '../components/chat/MovieSuggestion'
import useUserStore from '../stores/useUserStore'
import { useNavigate } from 'react-router-dom'

const MOOD_PROMPTS = [
  { label: "Something intense", icon: "🔥", message: "I want something dark and intense tonight" },
  { label: "Make me laugh", icon: "😂", message: "I want a comedy that'll actually make me laugh out loud" },
  { label: "90 min max", icon: "⏱️", message: "I have 90 minutes. Pick me something good" },
  { label: "Hidden gem", icon: "💎", message: "Show me an underrated hidden gem I've probably never heard of" },
  { label: "Surprise me", icon: "🎲", message: "Surprise me with something completely unexpected" },
  { label: "Cry it out", icon: "😢", message: "I want something emotional that'll make me feel something deep" },
  { label: "Mind-bending", icon: "🌀", message: "Something that'll mess with my head and make me think" },
  { label: "Date night", icon: "🍿", message: "Perfect date night movie — engaging but not too dark" },
]

function ChatMessage({ msg }) {
  const [revealed, setRevealed] = useState({})

  if (msg.role === 'user') {
    return (
      <div className="flex justify-end mb-4">
        <div className="max-w-xs bg-primary/20 border border-primary/30 rounded-2xl rounded-tr-sm px-4 py-3 text-sm">{msg.content}</div>
      </div>
    )
  }

  if (msg.type === 'loading') {
    return (
      <div className="flex gap-3 mb-4">
        <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-4 h-4 text-primary" />
        </div>
        <div className="bg-white/5 border border-white/10 rounded-2xl rounded-tl-sm px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-white/50">
            <div className="flex gap-1">
              <div className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            CineAI is thinking...
          </div>
        </div>
      </div>
    )
  }

  if (msg.type === 'picks') {
    return (
      <div className="flex gap-3 mb-6">
        <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
          <Sparkles className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1">
          {msg.thought && (
            <div className="bg-white/3 border border-white/8 rounded-2xl rounded-tl-sm px-4 py-3 mb-3 text-sm text-white/60 italic max-w-lg">
              {msg.thought}
            </div>
          )}
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin">
            {msg.picks?.map((pick, i) => (
              <MovieSuggestion
                key={pick.tmdbId}
                pick={pick}
                blindMode={msg.blindMode}
                revealed={revealed[i]}
                onReveal={() => setRevealed(r => ({ ...r, [i]: true }))}
              />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (msg.type === 'error') {
    return (
      <div className="flex gap-3 mb-4">
        <div className="w-8 h-8 bg-red-500/20 rounded-full flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-4 h-4 text-red-400" />
        </div>
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-red-400">
          {msg.content}
        </div>
      </div>
    )
  }

  if (msg.type === 'upgrade') {
    return (
      <div className="flex gap-3 mb-4">
        <div className="w-8 h-8 bg-yellow-500/20 rounded-full flex items-center justify-center flex-shrink-0">
          <Crown className="w-4 h-4 text-yellow-400" />
        </div>
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl rounded-tl-sm px-4 py-4 max-w-sm">
          <p className="text-sm text-yellow-400 font-semibold mb-1">Daily limit reached</p>
          <p className="text-xs text-white/50 mb-3">You've used all 5 free AI picks today. Upgrade to CineAI Pro for unlimited picks, mood dial, blind pick mode, and more.</p>
          <button onClick={() => {/* TODO: trigger billing */}} className="flex items-center gap-1.5 px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-black rounded-full text-xs font-bold transition-all">
            <Crown className="w-3.5 h-3.5" /> Upgrade to Pro
          </button>
        </div>
      </div>
    )
  }

  return null
}

export default function Discover() {
  const { getToken } = useAuth()
  const profile = useUserStore(s => s.profile)
  const navigate = useNavigate()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [usage, setUsage] = useState(null)
  const [blindMode, setBlindMode] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    getUsage(getToken).then(setUsage).catch(() => {})
  }, [])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const sendMessage = async (text) => {
    const message = text || input.trim()
    if (!message || loading) return
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: message }])
    setMessages(prev => [...prev, { type: 'loading', role: 'assistant' }])
    setLoading(true)

    try {
      const result = await recommend(getToken, { message, isBlindPick: blindMode })
      setMessages(prev => prev.filter(m => m.type !== 'loading'))
      setMessages(prev => [...prev, {
        type: 'picks',
        role: 'assistant',
        picks: result.picks,
        thought: result.agentThought,
        blindMode: result.blindMode
      }])
      // Refresh usage
      getUsage(getToken).then(setUsage).catch(() => {})
    } catch (err) {
      setMessages(prev => prev.filter(m => m.type !== 'loading'))
      if (err.status === 402) {
        setMessages(prev => [...prev, { type: 'upgrade', role: 'assistant' }])
      } else {
        setMessages(prev => [...prev, { type: 'error', role: 'assistant', content: 'Something went wrong. Try again?' }])
      }
    }
    setLoading(false)
  }

  const isEmpty = messages.length === 0

  return (
    <div className="min-h-screen flex flex-col pt-16">
      {/* Header */}
      <div className="px-6 md:px-16 lg:px-24 py-6 border-b border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary/20 rounded-xl flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="font-bold text-lg">CineAI</h1>
              <p className="text-xs text-white/40">Powered by Claude · Your personal movie curator</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Blind mode toggle */}
            <button onClick={() => setBlindMode(b => !b)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${blindMode ? 'bg-purple-500/20 border-purple-500/30 text-purple-400' : 'bg-white/5 border-white/10 text-white/40 hover:text-white'}`}>
              <Shuffle className="w-3.5 h-3.5" /> Blind Pick
            </button>
            {/* Usage indicator */}
            {usage && !usage.unlimited && (
              <div className="text-xs text-white/30">
                {5 - (usage.picksUsedToday || 0)} picks left today
              </div>
            )}
            {profile?.plan === 'free' && (
              <button className="flex items-center gap-1 px-3 py-1.5 bg-yellow-500/15 border border-yellow-500/20 rounded-full text-xs text-yellow-400 font-medium hover:bg-yellow-500/25 transition-all">
                <Crown className="w-3 h-3" /> Upgrade
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto px-6 md:px-16 lg:px-24 py-6">
        {isEmpty ? (
          /* Welcome state */
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-10">
              <div className="w-20 h-20 bg-gradient-to-br from-primary/30 to-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-primary/20">
                <Sparkles className="w-10 h-10 text-primary" />
              </div>
              <h2 className="text-2xl font-bold mb-2">What are you in the mood for?</h2>
              <p className="text-white/40 text-sm">CineAI analyses your watch history and picks movies you'll actually love</p>
            </div>

            {/* Mood prompt grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
              {MOOD_PROMPTS.map(prompt => (
                <button key={prompt.label} onClick={() => sendMessage(prompt.message)}
                  className="flex flex-col items-center gap-2 p-4 bg-white/3 border border-white/8 rounded-2xl hover:border-white/20 hover:bg-white/5 transition-all text-center group">
                  <span className="text-2xl">{prompt.icon}</span>
                  <span className="text-xs font-medium text-white/60 group-hover:text-white transition-colors">{prompt.label}</span>
                </button>
              ))}
            </div>

            <p className="text-center text-xs text-white/25">Or type anything — "something like Inception", "a 90s thriller", "best Scorsese film"</p>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto">
            {messages.map((msg, i) => <ChatMessage key={i} msg={msg} />)}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="px-6 md:px-16 lg:px-24 py-4 border-t border-white/5 bg-black/50 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto flex gap-3">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            placeholder="Ask CineAI anything... 'something funny for tonight' or 'like Interstellar but lighter'"
            disabled={loading}
            className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-sm placeholder-white/25 focus:outline-none focus:border-primary/50 disabled:opacity-50 transition-colors"
          />
          <button
            onClick={() => sendMessage()}
            disabled={loading || !input.trim()}
            className="px-4 py-3 bg-primary hover:bg-primary-dull disabled:opacity-40 rounded-2xl transition-all flex-shrink-0"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
