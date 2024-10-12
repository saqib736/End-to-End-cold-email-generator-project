"use client"

import { useState, useEffect } from 'react'
import { SidebarIcon, X, Copy, Trash2 } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"

type HistoryItem = {
  id: number
  url: string
  email: string
  timestamp: number
}

export default function ColdEmailGenerator() {
  const [url, setUrl] = useState('')
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  useEffect(() => {
    const savedHistory = localStorage.getItem('emailHistory')
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory))
    }
  }, [])

  const generateEmail = async () => {
    setIsLoading(true)
    setError('')
    try {
      const response = await fetch('http://localhost:5000/generate-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      })
      if (!response.ok) throw new Error('Failed to generate email')
      const data = await response.json()
      setEmail(data.email)
      addToHistory(url, data.email)
    } catch (err) {
      setError('An error occurred while generating the email. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const addToHistory = (url: string, email: string) => {
    const newItem = { id: Date.now(), url, email, timestamp: Date.now() }
    const newHistory = [newItem, ...history].slice(0, 10)
    setHistory(newHistory)
    localStorage.setItem('emailHistory', JSON.stringify(newHistory))
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(email)
  }

  const deleteHistoryItem = (id: number) => {
    const newHistory = history.filter(item => item.id !== id)
    setHistory(newHistory)
    localStorage.setItem('emailHistory', JSON.stringify(newHistory))
  }

  const restoreHistoryItem = (item: HistoryItem) => {
    setUrl(item.url)
    setEmail(item.email)
  }

  const groupHistoryByDate = () => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
    const yesterday = today - 86400000
    const lastWeek = today - 86400000 * 7

    return {
      today: history.filter(item => item.timestamp >= today),
      yesterday: history.filter(item => item.timestamp >= yesterday && item.timestamp < today),
      lastWeek: history.filter(item => item.timestamp >= lastWeek && item.timestamp < yesterday),
      older: history.filter(item => item.timestamp < lastWeek)
    }
  }

  const renderHistoryGroup = (items: HistoryItem[], title: string) => {
    if (items.length === 0) return null
    return (
      <div key={title}>
        <h3 className="text-sm font-semibold text-gray-500 mb-2">{title}</h3>
        {items.map((item) => (
          <Card key={item.id} className="p-4 relative mb-2">
            <h3 className="font-semibold mb-2 pr-8">{item.url}</h3>
            <p className="text-sm text-gray-600 truncate">{item.email}</p>
            <div className="absolute top-2 right-2 flex gap-2">
              <Button
                onClick={() => restoreHistoryItem(item)}
                size="icon"
                variant="ghost"
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button
                onClick={() => deleteHistoryItem(item.id)}
                size="icon"
                variant="ghost"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        ))}
      </div>
    )
  }

  const groupedHistory = groupHistoryByDate()

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-pink-500 flex">
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-gradient-to-br from-purple-700 to-pink-600 shadow-xl transform ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } transition-transform duration-300 ease-in-out overflow-y-auto`}
      >
        <div className="p-4 space-y-4">
          {renderHistoryGroup(groupedHistory.today, 'Today')}
          {renderHistoryGroup(groupedHistory.yesterday, 'Yesterday')}
          {renderHistoryGroup(groupedHistory.lastWeek, 'Last 7 Days')}
          {renderHistoryGroup(groupedHistory.older, 'Older')}
        </div>
      </div>

      {/* Main content */}
      <div className={`flex-1 transition-all duration-300 ease-in-out ${isSidebarOpen ? 'ml-64' : 'ml-0'}`}>
        <div className="flex flex-col items-center justify-center p-4">
          <Card className="w-full max-w-2xl bg-white/90 backdrop-blur-sm shadow-xl">
            <CardContent className="p-6">
              <h1 className="text-3xl font-bold text-center mb-6">Cold Email Generator</h1>
              <div className="flex gap-2 mb-4">
                <Input
                  type="url"
                  placeholder="Enter website URL"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="rounded-full"
                />
                <Button
                  onClick={generateEmail}
                  disabled={isLoading || !url}
                  className="rounded-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold px-6"
                >
                  {isLoading ? 'Generating...' : 'Generate Email'}
                </Button>
              </div>
              {error && <p className="text-red-500 mb-4">{error}</p>}
              {email && (
                <div className="mt-6 bg-gray-100 p-4 rounded-lg relative">
                  <pre className="whitespace-pre-wrap">{email}</pre>
                  <Button
                    onClick={copyToClipboard}
                    className="absolute top-2 right-2 rounded-full"
                    size="icon"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Toggle button */}
      <Button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="fixed top-4 left-4 z-50 rounded-full bg-white/20 hover:bg-white/30 text-white"
        size="icon"
      >
        {isSidebarOpen ? <X className="h-6 w-6" /> : <SidebarIcon className="h-6 w-6" />}
      </Button>
    </div>
  )
}