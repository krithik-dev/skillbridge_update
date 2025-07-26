import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Modal } from 'react-native'

interface QuestionNavigatorProps {
  visible: boolean
  onClose: () => void
  sections: Array<{
    name: string
    maxQuestions: number
  }>
  currentSection: number
  currentQuestion: number
  answers: { [key: string]: string }
  flaggedQuestions: Set<string>
  onNavigate: (sectionIndex: number, questionIndex: number) => void
}

export const QuestionNavigator: React.FC<QuestionNavigatorProps> = ({
  visible,
  onClose,
  sections,
  currentSection,
  currentQuestion,
  answers,
  flaggedQuestions,
  onNavigate
}) => {
  const getQuestionStatus = (sectionIndex: number, questionIndex: number): 'current' | 'answered' | 'flagged' | 'unanswered' => {
    const questionKey = `${sectionIndex}_${questionIndex}`
    
    if (sectionIndex === currentSection && questionIndex === currentQuestion) {
      return 'current'
    }
    
    if (flaggedQuestions.has(questionKey)) {
      return 'flagged'
    }
    
    if (answers[questionKey]) {
      return 'answered'
    }
    
    return 'unanswered'
  }

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'current': return '#007bff'
      case 'answered': return '#28a745'
      case 'flagged': return '#ffc107'
      case 'unanswered': return '#e9ecef'
      default: return '#e9ecef'
    }
  }

  const getStatusTextColor = (status: string): string => {
    switch (status) {
      case 'current': return '#fff'
      case 'answered': return '#fff'
      case 'flagged': return '#000'
      case 'unanswered': return '#666'
      default: return '#666'
    }
  }

  const handleQuestionPress = (sectionIndex: number, questionIndex: number) => {
    onNavigate(sectionIndex, questionIndex)
    onClose()
  }

  const getTotalAnswered = (): number => {
    return Object.keys(answers).length
  }

  const getTotalQuestions = (): number => {
    return sections.reduce((total, section) => total + section.maxQuestions, 0)
  }

  const getTotalFlagged = (): number => {
    return flaggedQuestions.size
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Question Navigator</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{getTotalAnswered()}</Text>
            <Text style={styles.statLabel}>Answered</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{getTotalFlagged()}</Text>
            <Text style={styles.statLabel}>Flagged</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{getTotalQuestions() - getTotalAnswered()}</Text>
            <Text style={styles.statLabel}>Remaining</Text>
          </View>
        </View>

        <View style={styles.legendContainer}>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#007bff' }]} />
            <Text style={styles.legendText}>Current</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#28a745' }]} />
            <Text style={styles.legendText}>Answered</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#ffc107' }]} />
            <Text style={styles.legendText}>Flagged</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#e9ecef' }]} />
            <Text style={styles.legendText}>Unanswered</Text>
          </View>
        </View>

        <ScrollView style={styles.sectionsContainer}>
          {sections.map((section, sectionIndex) => (
            <View key={sectionIndex} style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>
                {section.name} ({section.maxQuestions} questions)
              </Text>
              
              <View style={styles.questionsGrid}>
                {Array.from({ length: section.maxQuestions }, (_, questionIndex) => {
                  const status = getQuestionStatus(sectionIndex, questionIndex)
                  const backgroundColor = getStatusColor(status)
                  const textColor = getStatusTextColor(status)
                  
                  return (
                    <TouchableOpacity
                      key={questionIndex}
                      style={[
                        styles.questionButton,
                        { backgroundColor }
                      ]}
                      onPress={() => handleQuestionPress(sectionIndex, questionIndex)}
                    >
                      <Text style={[styles.questionButtonText, { color: textColor }]}>
                        {questionIndex + 1}
                      </Text>
                      {status === 'flagged' && (
                        <Text style={styles.flagIcon}>🚩</Text>
                      )}
                    </TouchableOpacity>
                  )
                })}
              </View>
            </View>
          ))}
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.footerButton} onPress={onClose}>
            <Text style={styles.footerButtonText}>Continue Test</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e9ecef',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: '#666',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007bff',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#666',
  },
  sectionsContainer: {
    flex: 1,
    padding: 20,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  questionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  questionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  questionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  flagIcon: {
    position: 'absolute',
    top: -4,
    right: -4,
    fontSize: 12,
  },
  footer: {
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  footerButton: {
    backgroundColor: '#007bff',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  footerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
})

export default QuestionNavigator