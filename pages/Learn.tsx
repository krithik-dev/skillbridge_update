import React, { useEffect, useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native'
import { useNavigation, NavigationProp } from '@react-navigation/native'
import { supabase } from '../lib/supabase'
import { useSession } from '../hooks/useSession'

const sections = [
  { id: 1, title: 'Intro to Python' },
  { id: 2, title: 'Variables' },
  { id: 3, title: 'Data Types' },
  { id: 4, title: 'Loops' },
  { id: 5, title: 'Functions' },
  { id: 6, title: 'Final Challenge' },
]

type RootStackParamList = {
  Challenge: { sectionId: number; title: string }
}

export default function Learn() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>()
  const session = useSession()
  const [completedSections, setCompletedSections] = useState<number[]>([])
  const [xp, setXp] = useState(0)
  const [coins, setCoins] = useState(0)

  useEffect(() => {
    const fetchProgress = async () => {
      if (!session?.user) return

      try {
        // Fetch XP & completed sections
        const { data: progressData, error: progressError } = await supabase
          .from('user_progress')
          .select('section_id, xp_earned')
          .eq('user_id', session.user.id)
          .eq('completed', true)

        if (progressError) throw progressError

        setCompletedSections(progressData.map((row) => row.section_id))
        const totalXP = progressData.reduce((sum, row) => sum + row.xp_earned, 0)
        setXp(totalXP)

        // Fetch practice coins
        const { data: coinData, error: coinError } = await supabase
          .from('practice_sessions')
          .select('coins')
          .eq('user_id', session.user.id)

        if (coinError) throw coinError

        const totalCoins = coinData.reduce((sum, row) => sum + (row.coins || 0), 0)
        setCoins(totalCoins)
      } catch (error) {
        console.error('Error fetching progress or coins:', error)
      }
    }

    fetchProgress()
  }, [session])

  const handlePress = (section: { id: number; title: string }) => {
    const isLocked = section.id !== 1 && !completedSections.includes(section.id - 1)
    if (!isLocked) {
      navigation.navigate('Challenge', {
        sectionId: section.id,
        title: section.title,
      })
    }
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>🚀 Learn Python</Text>
      <Text style={styles.xpText}>🔥 XP: {xp}   🪙 Coins: {coins}</Text>

      {sections.map((section) => {
        const isLocked = section.id !== 1 && !completedSections.includes(section.id - 1)
        const isCompleted = completedSections.includes(section.id)

        return (
          <TouchableOpacity
            key={section.id}
            style={[
              styles.block,
              isLocked && styles.locked,
              isCompleted && styles.completed,
            ]}
            onPress={() => handlePress(section)}
            disabled={isLocked}
          >
            <Text style={styles.blockText}>
              {section.title} {isCompleted ? '✅' : isLocked ? '🔒' : ''}
            </Text>
          </TouchableOpacity>
        )
      })}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 10 },
  xpText: { fontSize: 16, marginBottom: 20 },
  block: {
    padding: 16,
    borderRadius: 10,
    marginBottom: 12,
    backgroundColor: '#d0f0ff',
  },
  locked: {
    backgroundColor: '#ccc',
  },
  completed: {
    backgroundColor: '#c8facc',
  },
  blockText: {
    fontSize: 18,
  },
})
