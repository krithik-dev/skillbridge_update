import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native'
import { RouteProp, useRoute } from '@react-navigation/native'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { supabase } from '../lib/supabase'
import { useSession } from '../hooks/useSession'

const GEMINI_API_KEY = 'AIzaSyBvSEofW-r5vO_wQS8PmdYwXkwES2XMdy8' // 🔐 Replace with env variable

type QuizQuestion = {
  question: string
  options: string[]
  answer: string
}

type RouteParams = {
  PracticeQuiz: {
    topic: string
    questions: QuizQuestion[]
    difficulty: 'Easy' | 'Medium' | 'Hard'
  }
}

export default function PracticeQuiz() {
  const route = useRoute<RouteProp<RouteParams, 'PracticeQuiz'>>()
  const { topic, questions, difficulty } = route.params

  const session = useSession()

  const [current, setCurrent] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [showAnswer, setShowAnswer] = useState(false)
  const [explanation, setExplanation] = useState('')
  const [loadingExplanation, setLoadingExplanation] = useState(false)
  const [coinsEarned, setCoinsEarned] = useState(0)

  const currentQ = questions[current]

  useEffect(() => {
    if (current === questions.length - 1 && showAnswer) {
      // Reward coins when quiz finishes
      const totalCoins = questions.length
      setCoinsEarned(totalCoins)
      logPracticeSession(totalCoins)
    }
  }, [current, showAnswer])

  const logPracticeSession = async (coins: number) => {
    if (!session?.user) return

    const { error } = await supabase.from('practice_sessions').insert({
      user_id: session.user.id,
      topic,
      difficulty,
      coins,
    })

    if (error) {
      console.error('Error logging practice session:', error)
    }
  }

  const handleSelect = async (option: string) => {
    setSelected(option)
    setShowAnswer(true)

    try {
      setLoadingExplanation(true)
      const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

      const prompt = `
Give a concise explanation for why "${currentQ.answer}" is the correct answer to this multiple-choice question. Use bullet points.

Question: ${currentQ.question}
Options: ${currentQ.options.join(', ')}
User selected: ${option}

Respond in:
- Point 1
- Point 2
- ...
Keep it simple and beginner-friendly.
      `

      const result = await model.generateContent(prompt)
      const text = await result.response.text()
      setExplanation(text.trim())
    } catch (err) {
      console.error('Error fetching explanation:', err)
      setExplanation('Could not load explanation.')
    } finally {
      setLoadingExplanation(false)
    }
  }

  const handleNext = () => {
    if (current + 1 < questions.length) {
      setCurrent(current + 1)
      setSelected(null)
      setShowAnswer(false)
      setExplanation('')
    } else {
      Alert.alert('🎉 Done!', `You earned ${questions.length} coins!`)
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.topic}>🧠 Topic: {topic}</Text>
      <Text style={styles.counter}>Question {current + 1} of {questions.length}</Text>
      <Text style={styles.question}>{currentQ.question}</Text>

      {currentQ.options.map((option, idx) => {
        const isCorrect = option === currentQ.answer
        const isSelected = option === selected

        let bgColor = '#f0f0f0'
        if (showAnswer) {
          if (isCorrect) bgColor = '#c8facc'
          else if (isSelected) bgColor = '#fdd'
        } else if (isSelected) {
          bgColor = '#cce5ff'
        }

        return (
          <TouchableOpacity
            key={idx}
            onPress={() => handleSelect(option)}
            disabled={showAnswer}
            style={[styles.option, { backgroundColor: bgColor }]}
          >
            <Text style={styles.optionText}>{option}</Text>
          </TouchableOpacity>
        )
      })}

      {showAnswer && (
        <View style={styles.answerContainer}>
          <Text style={styles.answerText}>
            ✅ Correct Answer: {currentQ.answer}
          </Text>

          {loadingExplanation ? (
            <ActivityIndicator style={{ marginTop: 10 }} />
          ) : (
            <Text style={styles.explanation}>{explanation}</Text>
          )}

          <TouchableOpacity onPress={handleNext} style={styles.nextButton}>
            <Text style={styles.nextText}>
              {current + 1 < questions.length ? 'Next' : 'Finish'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#fff', flexGrow: 1 },
  topic: { fontSize: 16, fontWeight: 'bold', marginBottom: 8 },
  counter: { fontSize: 14, color: '#888', marginBottom: 10 },
  question: { fontSize: 18, marginBottom: 20 },
  option: {
    padding: 14,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  optionText: { fontSize: 16 },
  answerContainer: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
  },
  answerText: { fontWeight: 'bold', marginBottom: 10, fontSize: 16 },
  explanation: { marginTop: 10, fontSize: 15 },
  nextButton: {
    marginTop: 20,
    backgroundColor: '#007bff',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  nextText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
})
