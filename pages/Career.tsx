import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Linking,
  FlatList,
  Image,
  ScrollView,
} from 'react-native'
import axios from 'axios'

const GEMINI_API_KEY = 'AIzaSyDLPCKBIdNKcaLiH8WqF5mhWXyv2zzF9G0'
const YOUTUBE_API_KEY = 'AIzaSyD7BT9vJFIGFd0C2KdVl1QDHAkT7q3bszI'

export default function Career() {
  const [searchTerm, setSearchTerm] = useState('')
  const [courseLinks, setCourseLinks] = useState<{ title: string; url: string }[]>([])
  const [videos, setVideos] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const handleSearch = async () => {
    if (!searchTerm.trim()) return

    setLoading(true)
    await Promise.all([fetchCourses(searchTerm), fetchYouTubeVideos(searchTerm)])
    setLoading(false)
  }

  const fetchCourses = async (term: string) => {
    try {
      const prompt = `Give me 6 free course links with short titles on "${term}". Provide in JSON format like this: [{"title": "Course 1", "url": "https://..."}, ...]`

      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
        {
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
        }
      )

      const text = response.data.candidates?.[0]?.content?.parts?.[0]?.text || ''
      const jsonMatch = text.match(/\[.*\]/s)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        setCourseLinks(parsed)
      } else {
        console.warn('No valid JSON found in Gemini response')
        setCourseLinks([])
      }
    } catch (error) {
      console.error('Gemini error:', error)
      setCourseLinks([])
    }
  }

  const fetchYouTubeVideos = async (term: string) => {
    try {
      const response = await axios.get(
        'https://www.googleapis.com/youtube/v3/search',
        {
          params: {
            part: 'snippet',
            maxResults: 6,
            q: term,
            type: 'video',
            key: YOUTUBE_API_KEY,
          },
        }
      )

      setVideos(response.data.items)
    } catch (error) {
      console.error('YouTube error:', error)
      setVideos([])
    }
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>🔎 Source</Text>

      <TextInput
        style={styles.input}
        placeholder="Search topic (e.g. Data Science, Python)"
        value={searchTerm}
        onChangeText={setSearchTerm}
      />

      <TouchableOpacity style={styles.button} onPress={handleSearch}>
        <Text style={styles.buttonText}>Search</Text>
      </TouchableOpacity>

      {loading ? (
        <Text style={styles.loading}>Searching...</Text>
      ) : (
        <>
          {/* Course Links */}
          {courseLinks.length > 0 && (
            <View>
              <Text style={styles.sectionTitle}>📚 Free Courses</Text>
              {courseLinks.map((item, index) => (
                <TouchableOpacity key={index} onPress={() => Linking.openURL(item.url)} style={styles.card}>
                  <Text style={styles.linkTitle}>{item.title}</Text>
                  <Text style={styles.linkUrl}>{item.url}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* YouTube Videos */}
          {videos.length > 0 && (
            <View>
              <Text style={styles.sectionTitle}>▶️ YouTube Videos</Text>
              <FlatList
                data={videos}
                keyExtractor={(item) => item.id.videoId}
                horizontal
                showsHorizontalScrollIndicator={false}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    onPress={() => Linking.openURL(`https://www.youtube.com/watch?v=${item.id.videoId}`)}
                    style={styles.videoCard}
                  >
                    <Image
                      source={{ uri: item.snippet.thumbnails.medium.url }}
                      style={styles.thumbnail}
                    />
                    <Text style={styles.videoTitle} numberOfLines={2}>
                      {item.snippet.title}
                    </Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          )}
        </>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 12 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  button: {
    backgroundColor: '#007bff',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: { color: '#fff', fontWeight: 'bold' },
  loading: { fontSize: 16, textAlign: 'center', marginTop: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginTop: 20, marginBottom: 10 },
  card: {
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
  },
  linkTitle: { fontWeight: 'bold', fontSize: 16 },
  linkUrl: { fontSize: 14, color: '#555' },
  videoCard: {
    width: 220,
    marginRight: 12,
  },
  thumbnail: { width: '100%', height: 120, borderRadius: 8 },
  videoTitle: { fontSize: 14, marginTop: 4 },
})
