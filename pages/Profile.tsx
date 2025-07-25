import React, { useEffect, useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import { supabase } from '../lib/supabase'
import { Session } from '@supabase/supabase-js'

export default function Profile() {
  const [session, setSession] = useState<Session | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [])

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      Alert.alert('Error', error.message)
    } else {
      Alert.alert('Signed out', 'You have been signed out.')
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>👤 Profile</Text>
      {session?.user ? (
        <View style={styles.details}>
          <Text style={styles.label}>Email:</Text>
          <Text style={styles.value}>{session.user.email}</Text>
        </View>
      ) : (
        <Text style={styles.value}>Not logged in</Text>
      )}

      <TouchableOpacity style={styles.editButton} onPress={() => Alert.alert('Coming soon', 'Edit profile feature coming soon!')}>
        <Text style={styles.editText}>Edit Profile</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutButton} onPress={handleSignOut}>
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center', backgroundColor: '#fff' },
  title: { fontSize: 26, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  details: { marginBottom: 30 },
  label: { fontSize: 16, fontWeight: '600' },
  value: { fontSize: 16, color: '#333', marginTop: 4 },
  editButton: {
    backgroundColor: '#FFA500',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15,
  },
  editText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  logoutButton: {
    backgroundColor: '#FF3B30',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
})
