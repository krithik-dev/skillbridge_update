import React, { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, ActivityIndicator, Alert
} from 'react-native'
import { GoogleGenerativeAI } from '@google/generative-ai'

const GEMINI_API_KEY = 'AIzaSyBvSEofW-r5vO_wQS8PmdYwXkwES2XMdy8'

export default function CareerNavigator() {
  const [domain, setDomain] = useState('')
  const [skills, setSkills] = useState('')
  const [goal, setGoal] = useState('')
  const [notes, setNotes] = useState('')
  const [structuredData, setStructuredData] = useState<any>({})
  const [loading, setLoading] = useState(false)

  const handleGenerate = async () => {
    if (!domain || !skills || !goal) {
      Alert.alert('Please fill all required fields.')
      return
    }

    setLoading(true)
    setStructuredData({})

    try {
      const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

      const prompt = `
You're a career guidance assistant. The user provides:
- Domain: ${domain}
- Current Skills: ${skills}
- Career Goal: ${goal}
- Notes: ${notes || 'None'}

Respond ONLY with a valid compact JSON. Do not add any markdown, explanations or symbols like *, **, or code blocks.

{
  "path": ["step1", "step2", "step3"],
  "skills": ["skill1", "skill2"],
  "roles": ["role1", "role2"],
  "resources": ["resource1", "resource2"]
}
`

      const result = await model.generateContent(prompt)
      const rawText = await result.response.text()

      // ✅ Clean & extract JSON string
      const jsonMatch = rawText.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error('No valid JSON found.')

      const cleanText = jsonMatch[0]
        .replace(/[\r\n]/g, '')
        .replace(/,\s*]/g, ']') // fix trailing commas

      const json = JSON.parse(cleanText)
      setStructuredData(json)
    } catch (err) {
      console.error('Gemini error:', err)
      Alert.alert('Error', 'Invalid AI response. Try again or adjust input.')
    } finally {
      setLoading(false)
    }
  }

  const renderList = (title: string, items: string[]) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {items.map((item, idx) => (
        <Text key={idx} style={styles.listItem}>• {item}</Text>
      ))}
    </View>
  )

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>🧭 Career Navigator</Text>

      <TextInput
        placeholder="Domain (e.g. Web Dev, AI)"
        value={domain}
        onChangeText={setDomain}
        style={styles.input}
      />
      <TextInput
        placeholder="Your current skills"
        value={skills}
        onChangeText={setSkills}
        style={styles.input}
      />
      <TextInput
        placeholder="Your dream role or goal"
        value={goal}
        onChangeText={setGoal}
        style={styles.input}
      />
      <TextInput
        placeholder="Optional notes"
        value={notes}
        onChangeText={setNotes}
        style={styles.input}
      />

      <TouchableOpacity onPress={handleGenerate} style={styles.button}>
        <Text style={styles.buttonText}>Generate Roadmap</Text>
      </TouchableOpacity>

      {loading && <ActivityIndicator size="large" style={{ marginTop: 20 }} />}

      {structuredData?.path && (
        <View style={styles.resultContainer}>
          {renderList('🗺️ Learning Path', structuredData.path)}
          {renderList('🛠️ Skills to Learn', structuredData.skills)}
          {renderList('💼 Target Roles', structuredData.roles)}
          {renderList('📚 Resources', structuredData.resources)}
        </View>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#fff', flexGrow: 1 },
  heading: { fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#007bff',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  resultContainer: { marginTop: 30 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  listItem: { fontSize: 15, marginBottom: 6 },
})
