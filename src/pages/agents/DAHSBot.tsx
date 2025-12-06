/**
 * DAHSBot Page - DAHS Product Expert MCP Interface
 *
 * Interactive chat with DAHSBot to explore:
 * - DAHS capabilities and features
 * - Requirement-to-feature mapping
 * - Gap analysis
 * - Implementation approaches
 */

import { DAHSBotService, type DAHSBotResponse } from '@agents/dahsbot/index'
import { useEffect, useRef, useState } from 'react'
import styles from './AgentPage.module.css'

const dahsBot = new DAHSBotService()

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  response?: DAHSBotResponse
}

function DAHSBot(): React.JSX.Element {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '0',
      role: 'assistant',
      content: `🖥️ Hello! I'm **DAHSBot**, the DAHS Product Expert.

I know everything about the Data Acquisition and Handling System:
• **6 Core Modules** with 18+ features
• **Part 75** fully implemented
• **MATS** support included
• **QA/QC** comprehensive tracking

**Try asking me:**
• "Can DAHS handle SO2 CEMS monitoring?"
• "Show me all DAHS capabilities"
• "What gaps exist for MATS?"
• "How does DAHS calculate heat input?"

I can also "debate" with RegsBot about the best way to implement requirements! 🤖⚔️🤖`,
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    if (input.trim() === '' || loading) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const response = await dahsBot.query(input)

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.answer,
        timestamp: new Date(),
        response,
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (err) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `❌ Error: ${err instanceof Error ? err.message : 'An error occurred'}`,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  const handleQuickQuestion = (question: string): void => {
    setInput(question)
  }

  const renderMessageContent = (content: string): React.JSX.Element => {
    const lines = content.split('\n')
    return (
      <div className={styles.messageContent}>
        {lines.map((line, i) => {
          let rendered = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
          rendered = rendered.replace(/_(.*?)_/g, '<em>$1</em>')

          if (line.startsWith('•') || line.startsWith('-')) {
            return (
              <p
                key={i}
                className={styles.bulletPoint}
                dangerouslySetInnerHTML={{ __html: rendered }}
              />
            )
          }
          if (line.trim() === '') {
            return <br key={i} />
          }
          return <p key={i} dangerouslySetInnerHTML={{ __html: rendered }} />
        })}
      </div>
    )
  }

  return (
    <div className={styles.agentPage}>
      <header className={styles.header}>
        <span className={styles.icon}>🖥️</span>
        <div className={styles.headerText}>
          <h1 className={styles.title}>DAHSBot</h1>
          <p className={styles.subtitle}>DAHS Product Expert MCP</p>
        </div>
        <div className={styles.status}>
          <span className={styles.statusDot} />
          <span>Online</span>
        </div>
      </header>

      {/* Quick Actions */}
      <div className={styles.quickActions}>
        <button
          type="button"
          onClick={() => {
            handleQuickQuestion('Show me all DAHS capabilities')
          }}
          className={styles.quickButton}
        >
          📦 All Capabilities
        </button>
        <button
          type="button"
          onClick={() => {
            handleQuickQuestion('Can DAHS handle SO2 CEMS monitoring?')
          }}
          className={styles.quickButton}
        >
          🧪 SO2 Support?
        </button>
        <button
          type="button"
          onClick={() => {
            handleQuickQuestion('What gaps exist for MATS compliance?')
          }}
          className={styles.quickButton}
        >
          🔍 MATS Gaps
        </button>
        <button
          type="button"
          onClick={() => {
            handleQuickQuestion('How does DAHS implement missing data substitution?')
          }}
          className={styles.quickButton}
        >
          🔧 Missing Data
        </button>
      </div>

      {/* Chat Container */}
      <div className={styles.chatContainer}>
        <div className={styles.chatMessages}>
          {messages.map((msg) => (
            <div key={msg.id} className={`${styles.chatMessage} ${styles[msg.role]}`}>
              <div className={styles.messageHeader}>
                <span className={styles.messageRole}>
                  {msg.role === 'user' ? '👤 You' : '🖥️ DAHSBot'}
                </span>
                <span className={styles.messageTime}>{msg.timestamp.toLocaleTimeString()}</span>
              </div>

              {renderMessageContent(msg.content)}

              {/* Show response metadata */}
              {msg.response && (
                <div className={styles.responseDetails}>
                  <span
                    className={styles.confidenceBadge}
                    data-confidence={msg.response.confidence}
                  >
                    {msg.response.confidence} confidence
                  </span>
                  {msg.response.canHandle ? (
                    <span className={styles.canHandleBadge}>✅ DAHS Can Handle</span>
                  ) : (
                    <span className={styles.cannotHandleBadge}>⚠️ May Need Development</span>
                  )}

                  {/* Feature mappings */}
                  {msg.response.mappings && msg.response.mappings.length > 0 && (
                    <details className={styles.detailsSection}>
                      <summary>🔗 Feature Mappings ({msg.response.mappings.length})</summary>
                      <div className={styles.dataGrid}>
                        {msg.response.mappings.map((mapping, i) => (
                          <div key={i} className={styles.dataItem}>
                            <strong>{mapping.dahsFeature?.name}</strong>
                            <p>Module: {mapping.dahsFeature?.module}</p>
                            <p>Coverage: {mapping.coverageStatus}</p>
                          </div>
                        ))}
                      </div>
                    </details>
                  )}

                  {/* Citations */}
                  {msg.response.citations.length > 0 && (
                    <details className={styles.detailsSection}>
                      <summary>📖 Regulatory Basis ({msg.response.citations.length})</summary>
                      <ul className={styles.citationsList}>
                        {msg.response.citations.map((cite, i) => (
                          <li key={i}>
                            <strong>[{cite.source}]</strong> {cite.reference}
                          </li>
                        ))}
                      </ul>
                    </details>
                  )}
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className={`${styles.chatMessage} ${styles.assistant}`}>
              <div className={styles.messageHeader}>
                <span className={styles.messageRole}>🖥️ DAHSBot</span>
              </div>
              <div className={styles.typing}>
                <span></span>
                <span></span>
                <span></span>
                Analyzing DAHS capabilities...
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className={styles.chatInputForm}>
          <input
            type="text"
            value={input}
            onChange={(e) => {
              setInput(e.target.value)
            }}
            placeholder="Ask about DAHS capabilities, requirements, or implementation..."
            className={styles.chatInput}
            disabled={loading}
          />
          <button
            type="submit"
            className={styles.chatSubmitButton}
            disabled={loading || input.trim() === ''}
          >
            {loading ? '⏳' : '📤'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default DAHSBot
