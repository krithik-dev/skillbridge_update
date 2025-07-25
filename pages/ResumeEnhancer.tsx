import React, { useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native'
import * as DocumentPicker from 'expo-document-picker'
import { GoogleGenerativeAI } from '@google/generative-ai'

const GEMINI_API_KEY = 'AIzaSyBvSEofW-r5vO_wQS8PmdYwXkwES2XMdy8' // 🔐 Store securely later

export default function ResumeEnhancer() {
  const [fileName, setFileName] = useState('')
  const [suggestions, setSuggestions] = useState('')
  const [loading, setLoading] = useState(false)

  const pickPDF = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
        multiple: false,
      })

      if (result.canceled || !result.assets?.length) {
        Alert.alert('❌ No file selected')
        return
      }

      const file = result.assets[0]
      const { uri, mimeType, name } = file

      if (mimeType !== 'application/pdf') {
        Alert.alert('Only PDF resumes allowed')
        return
      }

      setFileName(name)
      Alert.alert('✅ PDF selected', `File: ${name}\nParsing dummy text...`)

      setLoading(true)

      const dummyResumeText = `
        Software Engineer with experience in React Native, Firebase, and TypeScript.
        Internship at ABC Corp, built mobile app with 10K+ users.
        Skills: JavaScript, Python, SQL, Git, REST APIs.
      `

      await getSuggestionsFromAI(dummyResumeText)
    } catch (err) {
      console.error('Error picking PDF:', err)
      Alert.alert('Error', 'Failed to pick or validate the PDF resume.')
    }
  }

  const getSuggestionsFromAI = async (resumeText: string) => {
    try {
      const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

      const prompt = `
You are a resume expert. Carefully read this resume and suggest improvements.
Respond only with bullet points. Be concise and job-relevant.

Resume:
${resumeText}
      `

      const result = await model.generateContent(prompt)
      const text = await result.response.text()
      setSuggestions(text.trim())
    } catch (err) {
      console.error('Mentor AI error:', err)
      Alert.alert('AI Error', 'Failed to get suggestions. Try again later.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>📄 Resume Enhancer</Text>

      <TouchableOpacity onPress={pickPDF} style={styles.button}>
        <Text style={styles.buttonText}>Upload PDF Resume</Text>
      </TouchableOpacity>

      {fileName ? (
        <Text style={styles.fileInfo}>📁 Selected: {fileName}</Text>
      ) : null}

      {loading && <ActivityIndicator size="large" style={{ marginTop: 20 }} />}

      {suggestions ? (
        <View style={styles.result}>
          <Text style={styles.subheading}>📝 Suggestions:</Text>
          <Text style={styles.suggestions}>{suggestions}</Text>
        </View>
      ) : null}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#fff', flexGrow: 1 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
  button: {
    backgroundColor: '#007bff',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: { color: 'white', fontSize: 16 },
  fileInfo: { marginTop: 12, fontSize: 15, color: '#333' },
  result: { marginTop: 30 },
  subheading: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  suggestions: { fontSize: 15, lineHeight: 22 },
})
