import React, { useState, useEffect, useRef } from 'react'
import { Mic, MicOff, Volume2 } from 'lucide-react'
import { Button } from './button'
import { cn } from '../../lib/utils'

interface VoiceInputProps {
  onTranscript: (text: string) => void
  onError?: (error: string) => void
  className?: string
  language?: string
  continuous?: boolean
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList
  resultIndex: number
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string
  message: string
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  maxAlternatives: number
  start(): void
  stop(): void
  abort(): void
  onstart: ((event: Event) => void) | null
  onend: ((event: Event) => void) | null
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognition
}

declare global {
  interface Window {
    SpeechRecognition: SpeechRecognitionConstructor
    webkitSpeechRecognition: SpeechRecognitionConstructor
  }
}

export function VoiceInput({ 
  onTranscript, 
  onError, 
  className, 
  language = 'en-AU',
  continuous = false 
}: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const [transcript, setTranscript] = useState('')
  const [confidence, setConfidence] = useState(0)
  
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Check if speech recognition is supported
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    setIsSupported(!!SpeechRecognition)

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition()
      recognitionRef.current = recognition

      // Configure recognition
      recognition.continuous = continuous
      recognition.interimResults = true
      recognition.lang = language
      recognition.maxAlternatives = 1

      // Event handlers
      recognition.onstart = () => {
        setIsListening(true)
        setTranscript('')
        // Auto-stop after 30 seconds to prevent hanging
        timeoutRef.current = setTimeout(() => {
          recognition.stop()
        }, 30000)
      }

      recognition.onend = () => {
        setIsListening(false)
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
          timeoutRef.current = null
        }
      }

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let finalTranscript = ''
        let interimTranscript = ''

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i]
          if (result && result[0]) {
            const transcript = result[0].transcript

            if (result.isFinal) {
              finalTranscript += transcript
              setConfidence(result[0].confidence)
            } else {
              interimTranscript += transcript
            }
          }
        }

        const currentTranscript = finalTranscript || interimTranscript
        setTranscript(currentTranscript)

        // Send final transcript to parent
        if (finalTranscript) {
          onTranscript(finalTranscript.trim())
          if (!continuous) {
            recognition.stop()
          }
        }
      }

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech recognition error:', event.error)
        setIsListening(false)
        
        let errorMessage = 'Speech recognition failed'
        switch (event.error) {
          case 'not-allowed':
            errorMessage = 'Microphone access denied. Please allow microphone access and try again.'
            setHasPermission(false)
            break
          case 'no-speech':
            errorMessage = 'No speech detected. Please try again.'
            break
          case 'audio-capture':
            errorMessage = 'Microphone not found or not working.'
            break
          case 'network':
            errorMessage = 'Network error occurred during speech recognition.'
            break
          default:
            errorMessage = `Speech recognition error: ${event.error}`
        }
        
        onError?.(errorMessage)
      }
    }

    // Check microphone permissions on mount
    checkMicrophonePermission()

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      if (recognitionRef.current && isListening) {
        recognitionRef.current.stop()
      }
    }
  }, [language, continuous, onTranscript, onError, isListening])

  const checkMicrophonePermission = async () => {
    try {
      if ('permissions' in navigator) {
        const permission = await navigator.permissions.query({ name: 'microphone' as PermissionName })
        setHasPermission(permission.state === 'granted')
        
        permission.onchange = () => {
          setHasPermission(permission.state === 'granted')
        }
      } else {
        // Fallback for browsers without permissions API
        setHasPermission(null)
      }
    } catch (error) {
      console.error('Error checking microphone permission:', error)
      setHasPermission(null)
    }
  }

  const startListening = async () => {
    if (!isSupported || !recognitionRef.current) {
      onError?.('Speech recognition is not supported in this browser')
      return
    }

    if (isListening) return

    try {
      // Request microphone permission if needed
      if (hasPermission === false) {
        await navigator.mediaDevices.getUserMedia({ audio: true })
        setHasPermission(true)
      }

      recognitionRef.current.start()
    } catch (error) {
      console.error('Error starting speech recognition:', error)
      onError?.('Failed to start speech recognition. Please check microphone permissions.')
      setHasPermission(false)
    }
  }

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop()
    }
  }

  const toggleListening = () => {
    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }

  if (!isSupported) {
    return (
      <div className={cn("flex items-center gap-2 text-sm text-muted-foreground", className)}>
        <MicOff className="h-4 w-4" />
        <span>Voice input not supported</span>
      </div>
    )
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Button
        type="button"
        variant={isListening ? "default" : "outline"}
        size="sm"
        onClick={toggleListening}
        disabled={hasPermission === false}
        className={cn(
          "relative",
          isListening && "bg-red-500 hover:bg-red-600 text-white animate-pulse"
        )}
      >
        {isListening ? (
          <MicOff className="h-4 w-4" />
        ) : (
          <Mic className="h-4 w-4" />
        )}
        
        {isListening && (
          <div className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full animate-ping" />
        )}
      </Button>

      {isListening && transcript && (
        <div className="flex items-center gap-2 text-sm">
          <Volume2 className="h-4 w-4 text-blue-500" />
          <span className="italic text-muted-foreground">
            {transcript}
          </span>
          {confidence > 0 && (
            <span className="text-xs text-muted-foreground">
              ({Math.round(confidence * 100)}%)
            </span>
          )}
        </div>
      )}

      {hasPermission === false && (
        <span className="text-xs text-destructive">
          Microphone access required
        </span>
      )}
    </div>
  )
}

// Enhanced Textarea component with voice input
interface VoiceTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  onVoiceInput?: (text: string) => void
  appendVoiceInput?: boolean // Whether to append or replace text
}

export function VoiceTextarea({ 
  onVoiceInput, 
  appendVoiceInput = true, 
  className, 
  ...props 
}: VoiceTextareaProps) {
  const [value, setValue] = useState(props.value || '')
  const [error, setError] = useState<string>('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleVoiceTranscript = (transcript: string) => {
    const newValue = appendVoiceInput 
      ? `${value} ${transcript}`.trim()
      : transcript

    setValue(newValue)
    onVoiceInput?.(transcript)
    
    // Update the actual textarea value
    if (textareaRef.current) {
      textareaRef.current.value = newValue
      // Trigger change event
      const event = new Event('input', { bubbles: true })
      textareaRef.current.dispatchEvent(event)
    }

    // Clear any previous errors
    setError('')
  }

  const handleVoiceError = (errorMessage: string) => {
    setError(errorMessage)
    // Clear error after 5 seconds
    setTimeout(() => setError(''), 5000)
  }

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value)
    props.onChange?.(e)
  }

  return (
    <div className="space-y-2">
      <div className="relative">
        <textarea
          {...props}
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          className={cn(
            "min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
        />
        
        <div className="absolute top-2 right-2">
          <VoiceInput
            onTranscript={handleVoiceTranscript}
            onError={handleVoiceError}
          />
        </div>
      </div>

      {error && (
        <div className="text-sm text-destructive">
          {error}
        </div>
      )}
    </div>
  )
}