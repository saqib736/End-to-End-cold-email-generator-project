"use client"

import { useState, useEffect } from 'react'
import { SidebarIcon, X, Copy, Trash2, Plus, Send } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import Lottie from 'react-lottie-player'
import emailAnimationData from '@/animations/email-animation.json'

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
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<HistoryItem | null>(null);

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

  const copyToClipboard = (emailToCopy: string) => {
    navigator.clipboard.writeText(emailToCopy)
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

  const viewHistoryItem = (item: HistoryItem) => {
    setSelectedHistoryItem(item);
  };

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
    if (items.length === 0) return null;
    return (
      <div key={title}>
        <h3 className="text-sm font-semibold text-gray-400 mb-2">{title}</h3>
        {items.map((item) => (
          <Card key={item.id} className="p-2 relative mb-2 bg-gray-800 text-white">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold truncate flex-grow cursor-pointer" onClick={() => viewHistoryItem(item)}>{item.url}</h3>
              <Button
                onClick={() => deleteHistoryItem(item.id)}
                size="icon"
                variant="ghost"
                className="text-gray-400 hover:text-white"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        ))}
      </div>
    );
  };

  const groupedHistory = groupHistoryByDate()

  const resetEmailGeneration = () => {
    setSelectedHistoryItem(null);
    setUrl('');
    setEmail('');
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex">
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-gray-800 shadow-xl transform ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } transition-transform duration-300 ease-in-out overflow-y-auto`}
      >
        <div className="p-4 space-y-4">
          <div className="flex justify-between items-center mb-4">
            <Button
              onClick={() => setIsSidebarOpen(false)}
              className="rounded-full bg-gray-700 hover:bg-gray-600 text-white"
              size="icon"
            >
              <X className="h-6 w-6" />
            </Button>
            <Button
              onClick={resetEmailGeneration}
              className="rounded-full bg-gray-700 hover:bg-gray-600 text-white"
              size="icon"
            >
              <Plus className="h-6 w-6" />
            </Button>
          </div>
          {renderHistoryGroup(groupedHistory.today, 'Today')}
          {renderHistoryGroup(groupedHistory.yesterday, 'Yesterday')}
          {renderHistoryGroup(groupedHistory.lastWeek, 'Last 7 Days')}
          {renderHistoryGroup(groupedHistory.older, 'Older')}
        </div>
      </div>

      {/* Main content */}
      <div className={`flex-1 transition-all duration-300 ease-in-out ${isSidebarOpen ? 'ml-64' : 'ml-0'}`}>
        <div className="flex flex-col items-center justify-start p-4 min-h-screen">
          <div className="w-full max-w-4xl mt-16">
            <h1 className="text-5xl font-bold text-center mb-8 text-red-500">Cold Email Generator</h1>
            <h1 className="text-1xl font-bold text-center mb-8 text-blue-500">Generate personalized cold emails based on website content</h1>
            <Lottie
              loop
              animationData={emailAnimationData}
              play
              style={{ width: 150, height: 150, margin: '0 auto 2rem' }}
            />
            <Card className="w-full bg-gray-800 shadow-xl">
              <CardContent className="p-6">
                {/* {!selectedHistoryItem && (
                  <p className="text-center text-blue-400 mb-6">Generate personalized cold emails based on website content</p>
                )} */}
                {!selectedHistoryItem && (
                  <div className="flex gap-2 mb-4">
                    <Input
                      type="url"
                      placeholder="Enter website URL"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      className="rounded-full bg-gray-700 text-white border-gray-600"
                    />
                    <Button
                      onClick={generateEmail}
                      disabled={isLoading || !url}
                      className="rounded-full bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6"
                    >
                      {isLoading ? 'Generating...' : 'Generate Email'}
                      <Send className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                )}
                {error && <p className="text-red-500 mb-4">{error}</p>}
                {(email || selectedHistoryItem) && (
                  <div className="mt-6 bg-gray-700 p-4 rounded-lg relative">
                    {selectedHistoryItem ? (
                      <>
                        <p className="mb-2">
                          <span className="font-semibold text-red-400">Query URL: </span>
                          <span className="text-cyan-300">{selectedHistoryItem.url}</span>
                        </p>
                        <p className="mb-3">
                          <span className="font-semibold text-green-400">Response: </span>
                        </p>
                        <pre className="whitespace-pre-wrap text-gray-300">{selectedHistoryItem.email}</pre>
                      </>
                    ) : (
                      <pre className="whitespace-pre-wrap text-gray-300">{email}</pre>
                    )}
                    <Button
                      onClick={() => copyToClipboard(selectedHistoryItem ? selectedHistoryItem.email : email)}
                      className="absolute top-2 right-2 rounded-full bg-gray-600 hover:bg-gray-500"
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
      </div>

      {/* Toggle button */}
      <Button
        onClick={() => setIsSidebarOpen(prevState => !prevState)}
        className="fixed top-4 left-4 z-50 rounded-full bg-gray-700 hover:bg-gray-600 text-white"
        size="icon"
      >
        {isSidebarOpen ? <X className="h-6 w-6" /> : <SidebarIcon className="h-6 w-6" />}
      </Button>
    </div>
  )
}