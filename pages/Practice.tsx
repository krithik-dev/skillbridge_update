import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native'
import { useNavigation, NavigationProp } from '@react-navigation/native'
import { GoogleGenerativeAI } from '@google/generative-ai'

// 🔐 TODO: Move to environment variable
const GEMINI_API_KEY = 'AIzaSyDLPCKBIdNKcaLiH8WqF5mhWXyv2zzF9G0'
const premadeTopics = ['Python', 'Machine Learning']
const difficulties = ['Easy', 'Medium', 'Hard']

type RootStackParamList = {
  PracticeQuiz: {
    topic: string
    questions: {
      question: string
      options: string[]
      answer: string
      explanation?: string
    }[]
  }
}

export default function Practice() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>()
  const [topic, setTopic] = useState('')
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Easy')
  const [loading, setLoading] = useState(false)

  const generateQuiz = async (selectedTopic: string) => {
    try {
      setLoading(true)

      const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })


      const prompt = `Generate 5 ${difficulty.toLowerCase()} level multiple choice questions on "${selectedTopic}".
Each question must be in JSON format with fields: question, options (array of 4), answer, and explanation.
Return only a JSON array like this:
[
  {
    "question": "What is Python?",
    "options": ["A programming language", "A snake", "A movie", "A car"],
    "answer": "A programming language",
    "explanation": "Python is a high-level programming language used for various applications."
  }
]`

      const result = await model.generateContent(prompt)
      const response = await result.response.text()

      const jsonStart = response.indexOf('[')
      const jsonEnd = response.lastIndexOf(']') + 1
      const jsonText = response.slice(jsonStart, jsonEnd)
      const parsed = JSON.parse(jsonText)

      navigation.navigate('PracticeQuiz', {
        topic: selectedTopic,
        questions: parsed,
      })
    } catch (err) {
      console.error(err)
      Alert.alert('Failed to generate quiz. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Practice Center update</Text>

      <Text style={styles.label}>Enter a topic to generate quiz:</Text>
      <TextInput
        value={topic}
        onChangeText={setTopic}
        placeholder="e.g. functions, loops"
        style={styles.input}
      />

      <Text style={styles.label}>Choose difficulty:</Text>
      <View style={styles.difficultyRow}>
        {difficulties.map((level) => (
          <TouchableOpacity
            key={level}
            style={[
              styles.difficultyButton,
              difficulty === level && styles.difficultySelected,
            ]}
            onPress={() => setDifficulty(level as 'Easy' | 'Medium' | 'Hard')}
          >
            <Text
              style={[
                styles.difficultyText,
                difficulty === level && styles.difficultyTextSelected,
              ]}
            >
              {level}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={styles.button}
        onPress={() => {
          if (!topic.trim()) {
            Alert.alert('Enter a topic first')
            return
          }
          generateQuiz(topic.trim())
        }}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Start Quiz</Text>
        )}
      </TouchableOpacity>

      <Text style={[styles.label, { marginTop: 30 }]}>Premade Quizzes:</Text>
      {premadeTopics.map((premade) => (
        <TouchableOpacity
          key={premade}
          style={styles.topicBox}
          onPress={() => generateQuiz(premade)}
        >
          <Text style={styles.topicText}>{premade}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#fff' },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  label: { fontSize: 16, marginBottom: 10 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  button: {
    backgroundColor: '#007bff',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  topicBox: {
    padding: 14,
    backgroundColor: '#e6f7ff',
    borderRadius: 8,
    marginBottom: 10,
  },
  topicText: { fontSize: 16 },
  difficultyRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  difficultyButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  difficultySelected: {
    backgroundColor: '#007bff',
    borderColor: '#007bff',
  },
  difficultyText: {
    fontSize: 14,
    color: '#333',
  },
  difficultyTextSelected: {
    color: '#fff',
    fontWeight: 'bold',
  },
})
