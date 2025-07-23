import React, { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import { useNavigation, useRoute } from '@react-navigation/native'
import { supabase } from '../lib/supabase'
import { useSession } from '../hooks/useSession'

export default function LearnChallenge() {
  const route = useRoute<any>()
  const navigation = useNavigation()
  const session = useSession()

  const { sectionId, title } = route.params
  const [selected, setSelected] = useState<number | null>(null)
  const [submitted, setSubmitted] = useState(false)

  // Sample MCQ (for demo; can be fetched dynamically)
  const question = 'What is the output of: print(2 + 3 * 4)?'
  const options = ['20', '14', '24', '10']
  const correctIndex = 1 // 14

  const handleSubmit = async () => {
    if (submitted || selected === null) return

    const isCorrect = selected === correctIndex
    setSubmitted(true)

    if (isCorrect) {
      const { error } = await supabase.from('user_progress').upsert({
        user_id: session?.user.id,
        section_id: sectionId,
        completed: true,
        xp_earned: 10,
      })

      if (error) {
        console.error('Error saving progress:', error)
        Alert.alert('Error', 'Could not save progress')
      } else {
        Alert.alert('Correct!', 'You earned 10 XP 🎉', [
          { text: 'Continue', onPress: () => navigation.goBack() },
        ])
      }
    } else {
      Alert.alert('Wrong', 'That’s not the right answer. Try again!')
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.question}>{question}</Text>

      {options.map((option, index) => (
        <TouchableOpacity
          key={index}
          style={[
            styles.option,
            selected === index && styles.selected,
            submitted && index === correctIndex && styles.correct,
            submitted && selected === index && selected !== correctIndex && styles.incorrect,
          ]}
          onPress={() => !submitted && setSelected(index)}
        >
          <Text>{option}</Text>
        </TouchableOpacity>
      ))}

      {!submitted && (
        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
          <Text style={styles.submitText}>Submit</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 16 },
  question: { fontSize: 18, marginBottom: 20 },
  option: {
    padding: 15,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginBottom: 10,
  },
  selected: {
    backgroundColor: '#d0e7ff',
  },
  correct: {
    backgroundColor: '#c8facc',
    borderColor: 'green',
  },
  incorrect: {
    backgroundColor: '#ffcccc',
    borderColor: 'red',
  },
  submitBtn: {
    backgroundColor: '#007bff',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  submitText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
})
