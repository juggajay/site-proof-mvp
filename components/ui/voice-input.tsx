'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Mic, MicOff, Volume2 } from 'lucide-react'
import { cn } from '../../lib/utils'

/* Site-Proof Professional B2B Voice Input System - Exact Landing Page Implementation */

// Speech Recognition API types
interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList
  resultIndex: number
}

interface SpeechRecognitionResultList {
  length: number
  item(index: number): SpeechRecognitionResult
  [index: number]: SpeechRecognitionResult
}

interface SpeechRecognitionResult {
  length: number
  item(index: number): SpeechRecognitionAlternative
  [index: number]: SpeechRecognitionAlternative
  isFinal: boolean
}

interface SpeechRecognitionAlternative {
  transcript: string
  confidence: number
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  maxAlternatives: number
  serviceURI: string
  start(): void
  stop(): void
  abort(): void
  onaudiostart: ((this: SpeechRecognition, ev: Event) => any) | null
  onaudioend: ((this: SpeechRecognition, ev: Event) => any) | null
  onend: ((this: SpeechRecognition, ev: Event) => any) | null
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null
  onnomatch: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null
  onsoundstart: ((this: SpeechRecognition, ev: Event) => any) | null
  onsoundend: ((this: SpeechRecognition, ev: Event) => any) | null
  onspeechstart: ((this: SpeechRecognition, ev: Event) => any) | null
  onspeechend: ((this: SpeechRecognition, ev: Event) => any) | null
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string
  message: string
}

declare global {
  interface Window {
    SpeechRecognition: {
      new (): SpeechRecognition
    }
    webkitSpeechRecognition: {
      new (): SpeechRecognition
    }
  }
}

interface VoiceInputProps {
  onTranscript: (transcript: string) => void
  className?: string
  disabled?: boolean
  language?: string
}

export function VoiceInput({ 
  onTranscript, 
  className, 
  disabled = false,
  language = 'en-AU' // Australian English optimized for construction terminology
}: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [confidence, setConfidence] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Check for Speech Recognition support
  const isSupported = typeof window !== 'undefined' && 
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)

  // Initialize Speech Recognition
  useEffect(() => {
    if (!isSupported) return

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SpeechRecognition()

    recognition.continuous = false
    recognition.interimResults = true
    recognition.lang = language
    recognition.maxAlternatives = 1

    recognition.onstart = () => {
      setIsListening(true)
      setError(null)
      setTranscript('')
      setConfidence(0)
      
      // Auto-timeout after 30 seconds to prevent hanging sessions
      timeoutRef.current = setTimeout(() => {
        recognition.stop()
      }, 30000)
    }

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = ''
      let interimTranscript = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        if (!result || !result[0]) continue
        
        const transcript = result[0].transcript
        const confidence = result[0].confidence

        if (result.isFinal) {
          finalTranscript += transcript
          setConfidence(confidence)
        } else {
          interimTranscript += transcript
        }
      }

      const currentTranscript = finalTranscript || interimTranscript
      setTranscript(currentTranscript)

      if (finalTranscript) {
        onTranscript(finalTranscript.trim())
      }
    }

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      setIsListening(false)
      
      switch (event.error) {
        case 'not-allowed':
          setError('Microphone access denied. Please allow microphone permissions.')
          setHasPermission(false)
          break
        case 'no-speech':
          setError('No speech detected. Please try again.')
          break
        case 'audio-capture':
          setError('No microphone found. Please check your audio settings.')
          break
        case 'network':
          setError('Network error. Please check your internet connection.')
          break
        default:
          setError(`Speech recognition error: ${event.error}`)
      }
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }

    recognition.onend = () => {
      setIsListening(false)
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }

    recognitionRef.current = recognition

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [isSupported, language, onTranscript])

  // Check microphone permissions
  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.mediaDevices) {
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(() => setHasPermission(true))
        .catch(() => setHasPermission(false))
    }
  }, [])

  const startListening = useCallback(() => {
    if (!recognitionRef.current || disabled || isListening) return

    try {
      recognitionRef.current.start()
    } catch (error) {
      setError('Failed to start voice recognition. Please try again.')
    }
  }, [disabled, isListening])

  const stopListening = useCallback(() => {
    if (!recognitionRef.current || !isListening) return

    recognitionRef.current.stop()
  }, [isListening])

  if (!isSupported) {
    return (
      <div className={cn("flex items-center gap-2 text-sm text-[#6C757D] font-primary", className)}>
        <MicOff className="h-4 w-4" />
        <span>Voice input not supported in this browser</span>
      </div>
    )
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={isListening ? stopListening : startListening}
          disabled={disabled || hasPermission === false}
          className={cn(
            "relative flex items-center justify-center w-8 h-8 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#1B4F72] focus:ring-offset-2",
            isListening 
              ? "bg-[#DC3545] hover:bg-[#C82333] text-white animate-pulse" 
              : "bg-[#1B4F72] hover:bg-[#154360] text-white",
            disabled && "opacity-50 cursor-not-allowed"
          )}
          title={isListening ? "Stop recording" : "Start voice input"}
        >
          {isListening ? <Mic className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          {isListening && (
            <div className="absolute -top-1 -right-1 h-3 w-3 bg-[#DC3545] rounded-full animate-ping" />
          )}
        </button>

        {isListening && transcript && (
          <div className="flex items-center gap-2 text-sm">
            <Volume2 className="h-4 w-4 text-[#1B4F72]" />
            <span className="italic text-[#6C757D] font-primary">
              {transcript}
            </span>
            {confidence > 0 && (
              <span className="text-xs text-[#6C757D] font-primary">
                ({Math.round(confidence * 100)}%)
              </span>
            )}
          </div>
        )}

        {hasPermission === false && (
          <span className="text-xs text-[#DC3545] font-primary">
            Microphone access required
          </span>
        )}
      </div>

      {error && (
        <div className="text-sm text-[#DC3545] font-primary">
          {error}
        </div>
      )}
    </div>
  )
}

// Enhanced textarea component with integrated voice input
interface VoiceTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  onVoiceTranscript?: (transcript: string) => void
}

export function VoiceTextarea({ 
  onVoiceTranscript, 
  className, 
  value, 
  onChange,
  ...props 
}: VoiceTextareaProps) {
  const [currentValue, setCurrentValue] = useState(value || '')

  useEffect(() => {
    setCurrentValue(value || '')
  }, [value])

  const handleVoiceTranscript = useCallback((transcript: string) => {
    const newValue = currentValue + (currentValue ? ' ' : '') + transcript
    setCurrentValue(newValue)
    
    // Create synthetic event for onChange
    const syntheticEvent = {
      target: { value: newValue },
      currentTarget: { value: newValue }
    } as React.ChangeEvent<HTMLTextAreaElement>
    
    onChange?.(syntheticEvent)
    onVoiceTranscript?.(transcript)
  }, [currentValue, onChange, onVoiceTranscript])

  const handleTextChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCurrentValue(e.target.value)
    onChange?.(e)
  }, [onChange])

  return (
    <div className="relative">
      <textarea
        {...props}
        value={currentValue}
        onChange={handleTextChange}
        className={cn(
          "flex min-h-[80px] w-full rounded-md border-2 border-[#6C757D] bg-white px-3 py-2 pr-12 text-sm font-primary text-[#2C3E50] ring-offset-white placeholder:text-[#6C757D] placeholder:italic focus-visible:outline-none focus-visible:border-[#1B4F72] focus-visible:ring-2 focus-visible:ring-[#1B4F72]/20 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-vertical transition-all duration-200",
          className
        )}
      />
      <div className="absolute top-2 right-2">
        <VoiceInput 
          onTranscript={handleVoiceTranscript}
          disabled={props.disabled}
        />
      </div>
    </div>
  )
}