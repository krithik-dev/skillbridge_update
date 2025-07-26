import React, { useEffect, useState } from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { supabase } from './lib/supabase'
import { Session } from '@supabase/supabase-js'

import { Buffer } from 'buffer'
global.Buffer = Buffer

import process from 'process'
global.process = process


// Auth Screens
import Login from './auth/Login'
import Signup from './auth/Signup'

// Main Pages
import Learn from './pages/Learn'
import Practice from './pages/Practice'
import Ask from './pages/Ask'
import Career from './pages/Career'
import Profile from './pages/Profile'

// Learn + Practice Screens
import LearnChallenge from './pages/LearnChallenge'
import PracticeQuiz from './pages/PracticeQuiz'

// Ask Feature Pages
import AIMentor from './pages/AIMentor'
import ResumeEnhancer from './pages/ResumeEnhancer'
import CareerNavigator from './pages/CareerNavigator'
import PeerSupport from './pages/PeerSupport'
import ProjectRoadmap from './pages/ProjectRoadmap'

// Aptitude Feature Pages
import AptitudeHome from './pages/AptitudeHome'
import CategoryView from './pages/CategoryView'
import TopicPractice from './pages/TopicPractice'
import MockTest from './pages/MockTest'
import ResultsView from './pages/ResultsView'
import ProgressDashboard from './pages/ProgressDashboard'

const RootStack = createNativeStackNavigator()
const Tab = createBottomTabNavigator()
const LearnStack = createNativeStackNavigator()
const PracticeStack = createNativeStackNavigator()
const AskStack = createNativeStackNavigator()
const AptitudeStack = createNativeStackNavigator()

// 📘 Learn Stack
function LearnStackScreen() {
  return (
    <LearnStack.Navigator>
      <LearnStack.Screen name="LearnHome" component={Learn} options={{ title: 'Learn' }} />
      <LearnStack.Screen
        name="Challenge"
        component={LearnChallenge}
        options={({
          route,
        }: {
          route: { params?: { title?: string } }
        }) => ({
          title: route?.params?.title ?? 'Challenge',
        })}
      />
    </LearnStack.Navigator>
  )
}

// 🧪 Practice Stack
function PracticeStackScreen() {
  return (
    <PracticeStack.Navigator>
      <PracticeStack.Screen name="PracticeHome" component={Practice} options={{ title: 'Practice' }} />
      <PracticeStack.Screen name="PracticeQuiz" component={PracticeQuiz} options={{ title: 'Quiz' }} />
    </PracticeStack.Navigator>
  )
}

// 💡 Ask Stack (with all subfeatures)
function AskStackScreen() {
  return (
    <AskStack.Navigator>
      <AskStack.Screen name="AskHome" component={Ask} options={{ title: 'Ask' }} />
      <AskStack.Screen name="AIMentor" component={AIMentor} options={{ title: 'AI Mentor Chat' }} />
      <AskStack.Screen name="ResumeEnhancer" component={ResumeEnhancer} options={{ title: 'Resume Enhancer' }} />
      <AskStack.Screen name="CareerNavigator" component={CareerNavigator} options={{ title: 'Career Navigator' }} />
      <AskStack.Screen name="PeerSupport" component={PeerSupport} options={{ title: 'Peer Support' }} />
      <AskStack.Screen name="ProjectRoadmap" component={ProjectRoadmap} options={{ title: 'Project Roadmap' }} />
    </AskStack.Navigator>
  )
}

// 🧠 Aptitude Stack (with all aptitude features)
function AptitudeStackScreen() {
  return (
    <AptitudeStack.Navigator>
      <AptitudeStack.Screen name="AptitudeHome" component={AptitudeHome} options={{ title: 'Aptitude' }} />
      <AptitudeStack.Screen name="CategoryView" component={CategoryView} options={{ title: 'Category' }} />
      <AptitudeStack.Screen name="TopicPractice" component={TopicPractice} options={{ title: 'Practice' }} />
      <AptitudeStack.Screen name="MockTest" component={MockTest} options={{ title: 'Mock Test' }} />
      <AptitudeStack.Screen name="ResultsView" component={ResultsView} options={{ title: 'Results' }} />
      <AptitudeStack.Screen name="ProgressDashboard" component={ProgressDashboard} options={{ title: 'Progress' }} />
    </AptitudeStack.Navigator>
  )
}

// 🧭 Main Tabs
function MainTabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Learn" component={LearnStackScreen} />
      <Tab.Screen name="Practice" component={PracticeStackScreen} />
      <Tab.Screen name="Ask" component={AskStackScreen} />
      <Tab.Screen name="Aptitude" component={AptitudeStackScreen} />
      <Tab.Screen name="Career" component={Career} />
      <Tab.Screen name="Profile" component={Profile} />
    </Tab.Navigator>
  )
}

export default function App() {
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

  return (
    <NavigationContainer>
      {session ? (
        <MainTabs />
      ) : (
        <RootStack.Navigator screenOptions={{ headerShown: false }}>
          <RootStack.Screen name="Login" component={Login} />
          <RootStack.Screen name="Signup" component={Signup} />
        </RootStack.Navigator>
      )}
    </NavigationContainer>
  )
}
