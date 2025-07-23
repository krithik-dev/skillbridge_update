import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { GoogleGenerativeAI } from '@google/generative-ai'

const GEMINI_API_KEY = 'AIzaSyBvSEofW-r5vO_wQS8PmdYwXkwES2XMdy8'

type Message = {
  sender: 'user' | 'mentor'
  text: string
}

export default function AIMentorChat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSend = async () => {
    if (!input.trim()) return

    const userMsg: Message = { sender: 'user', text: input.trim() }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

      const prompt = `
You are a supportive and experienced mentor. Answer clearly and positively, like you're guiding a student.

Student: ${input.trim()}
`

      const result = await model.generateContent(prompt)
      const aiResponse = await result.response.text()

      setMessages((prev) => [...prev, { sender: 'mentor', text: aiResponse.trim() }])
    } catch (err) {
      console.error('Mentor AI error:', err)
      setMessages((prev) => [...prev, { sender: 'mentor', text: '⚠️ Sorry, I had trouble responding.' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.chatContainer}>
        {messages.map((msg, idx) => (
          <View
            key={idx}
            style={[
              styles.message,
              msg.sender === 'user' ? styles.userMsg : styles.mentorMsg,
            ]}
          >
            <Text style={styles.msgText}>{msg.text}</Text>
          </View>
        ))}
        {loading && <ActivityIndicator style={{ marginVertical: 10 }} />}
      </ScrollView>

      <View style={styles.inputContainer}>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Ask your mentor..."
          style={styles.input}
          multiline
        />
        <TouchableOpacity onPress={handleSend} style={styles.sendBtn}>
          <Text style={styles.sendText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  chatContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  message: {
    padding: 12,
    marginBottom: 10,
    borderRadius: 10,
    maxWidth: '85%',
  },
  userMsg: {
    alignSelf: 'flex-end',
    backgroundColor: '#dbeafe',
  },
  mentorMsg: {
    alignSelf: 'flex-start',
    backgroundColor: '#ecfdf5',
  },
  msgText: {
    fontSize: 15,
  },
  inputContainer: {
    position: 'absolute',
    bottom: 0,
    flexDirection: 'row',
    padding: 12,
    borderTopWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  sendBtn: {
    marginLeft: 10,
    backgroundColor: '#2563eb',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  sendText: {
    color: 'white',
    fontWeight: 'bold',
  },
})
