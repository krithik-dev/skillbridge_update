// pages/Ask.tsx

import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native'
import { useNavigation } from '@react-navigation/native'

export default function Ask() {
  const navigation = useNavigation()

  const features = [
    { title: 'AI Mentor Chat', screen: 'AIMentor' },
    { title: 'Resume Enhancer', screen: 'ResumeEnhancer' },
    { title: 'Career Navigator', screen: 'CareerNavigator' },
    { title: 'Peer Support', screen: 'PeerSupport' },
    { title: 'Project Roadmap Generator', screen: 'ProjectRoadmap' },
  ]

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>🧠 Ask & Grow</Text>
      {features.map((feature) => (
        <TouchableOpacity
          key={feature.title}
          style={styles.card}
          onPress={() => navigation.navigate(feature.screen as never)}
        >
          <Text style={styles.cardText}>{feature.title}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#e0f7fa',
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
  },
  cardText: {
    fontSize: 18,
    fontWeight: '500',
  },
})
