import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet, TextInput } from 'react-native'
import { AptitudeQuestion } from '../types/aptitude'

interface QuestionCardProps {
  question: AptitudeQuestion
  currentIndex: number
  totalQuestions: number
  selectedAnswer?: string
  showAnswer: boolean
  onAnswerSelect: (answer: string) => void
  onNext: () => void
  onPrevious: () => void
  onHint: () => void
  hintsUsed: number
  maxHints: number
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  currentIndex,
  totalQuestions,
  selectedAnswer,
  showAnswer,
  onAnswerSelect,
  onNext,
  onPrevious,
  onHint,
  hintsUsed,
  maxHints
}) => {
  const renderMultipleChoice = () => (
    <View style={styles.optionsContainer}>
      {question.options?.map((option, index) => {
        const isSelected = option === selectedAnswer
        const isCorrect = option === question.correctAnswer
        const showCorrect = showAnswer && isCorrect
        const showIncorrect = showAnswer && isSelected && !isCorrect

        return (
          <TouchableOpacity
            key={index}
            style={[
              styles.optionButton,
              isSelected && !showAnswer && styles.optionSelected,
              showCorrect && styles.optionCorrect,
              showIncorrect && styles.optionIncorrect
            ]}
            onPress={() => onAnswerSelect(option)}
            disabled={showAnswer}
          >
            <Text style={[
              styles.optionText,
              isSelected && !showAnswer && styles.optionTextSelected,
              showCorrect && styles.optionTextCorrect,
              showIncorrect && styles.optionTextIncorrect
            ]}>
              {String.fromCharCode(65 + index)}. {option}
            </Text>
          </TouchableOpacity>
        )
      })}
    </View>
  )

  const renderNumerical = () => (
    <View style={styles.numericalContainer}>
      <Text style={styles.numericalLabel}>Enter your answer:</Text>
      <TextInput
        style={[
          styles.numericalInput,
          showAnswer && selectedAnswer === question.correctAnswer && styles.numericalCorrect,
          showAnswer && selectedAnswer !== question.correctAnswer && styles.numericalIncorrect
        ]}
        value={selectedAnswer || ''}
        onChangeText={onAnswerSelect}
        placeholder="Type your answer here"
        keyboardType="numeric"
        editable={!showAnswer}
      />
      {!showAnswer && (
        <TouchableOpacity 
          style={styles.submitButton}
          onPress={() => selectedAnswer && onAnswerSelect(selectedAnswer)}
        >
          <Text style={styles.submitButtonText}>Submit Answer</Text>
        </TouchableOpacity>
      )}
    </View>
  )

  const renderTrueFalse = () => (
    <View style={styles.trueFalseContainer}>
      {['True', 'False'].map((option) => {
        const isSelected = option === selectedAnswer
        const isCorrect = option === question.correctAnswer
        const showCorrect = showAnswer && isCorrect
        const showIncorrect = showAnswer && isSelected && !isCorrect

        return (
          <TouchableOpacity
            key={option}
            style={[
              styles.trueFalseButton,
              isSelected && !showAnswer && styles.optionSelected,
              showCorrect && styles.optionCorrect,
              showIncorrect && styles.optionIncorrect
            ]}
            onPress={() => onAnswerSelect(option)}
            disabled={showAnswer}
          >
            <Text style={[
              styles.trueFalseText,
              isSelected && !showAnswer && styles.optionTextSelected,
              showCorrect && styles.optionTextCorrect,
              showIncorrect && styles.optionTextIncorrect
            ]}>
              {option}
            </Text>
          </TouchableOpacity>
        )
      })}
    </View>
  )

  const renderQuestionContent = () => {
    switch (question.type) {
      case 'multiple-choice':
        return renderMultipleChoice()
      case 'numerical':
        return renderNumerical()
      case 'true-false':
        return renderTrueFalse()
      default:
        return renderMultipleChoice()
    }
  }

  return (
    <View style={styles.container}>
      {/* Question Header */}
      <View style={styles.header}>
        <Text style={styles.questionNumber}>
          Question {currentIndex + 1} of {totalQuestions}
        </Text>
        <View style={styles.typeIndicator}>
          <Text style={styles.typeText}>
            {question.type === 'multiple-choice' ? 'MCQ' : 
             question.type === 'numerical' ? 'NUM' : 'T/F'}
          </Text>
        </View>
      </View>

      {/* Question Text */}
      <Text style={styles.questionText}>{question.question}</Text>

      {/* Question Image (if available) */}
      {question.hasImage && question.imageUrl && (
        <View style={styles.imageContainer}>
          <Text style={styles.imagePlaceholder}>
            📊 Chart/Diagram would appear here
          </Text>
        </View>
      )}

      {/* Answer Options */}
      {renderQuestionContent()}

      {/* Hint Button */}
      {!showAnswer && hintsUsed < maxHints && (
        <TouchableOpacity style={styles.hintButton} onPress={onHint}>
          <Text style={styles.hintButtonText}>
            💡 Get Hint ({maxHints - hintsUsed} remaining)
          </Text>
        </TouchableOpacity>
      )}

      {/* Time Limit Indicator */}
      {question.timeLimit && (
        <View style={styles.timeLimitContainer}>
          <Text style={styles.timeLimitText}>
            ⏱️ Suggested time: {question.timeLimit}s
          </Text>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  questionNumber: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  typeIndicator: {
    backgroundColor: '#e9ecef',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typeText: {
    fontSize: 12,
    color: '#495057',
    fontWeight: '600',
  },
  questionText: {
    fontSize: 18,
    color: '#333',
    lineHeight: 26,
    marginBottom: 20,
  },
  imageContainer: {
    backgroundColor: '#f8f9fa',
    padding: 20,
    borderRadius: 8,
    marginBottom: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderStyle: 'dashed',
  },
  imagePlaceholder: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e9ecef',
  },
  optionSelected: {
    backgroundColor: '#e3f2fd',
    borderColor: '#007bff',
  },
  optionCorrect: {
    backgroundColor: '#d4edda',
    borderColor: '#28a745',
  },
  optionIncorrect: {
    backgroundColor: '#f8d7da',
    borderColor: '#dc3545',
  },
  optionText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 22,
  },
  optionTextSelected: {
    color: '#007bff',
    fontWeight: '600',
  },
  optionTextCorrect: {
    color: '#155724',
    fontWeight: '600',
  },
  optionTextIncorrect: {
    color: '#721c24',
    fontWeight: '600',
  },
  numericalContainer: {
    gap: 16,
  },
  numericalLabel: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  numericalInput: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e9ecef',
    fontSize: 18,
    textAlign: 'center',
  },
  numericalCorrect: {
    backgroundColor: '#d4edda',
    borderColor: '#28a745',
  },
  numericalIncorrect: {
    backgroundColor: '#f8d7da',
    borderColor: '#dc3545',
  },
  submitButton: {
    backgroundColor: '#007bff',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  trueFalseContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  trueFalseButton: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 20,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e9ecef',
    alignItems: 'center',
  },
  trueFalseText: {
    fontSize: 18,
    color: '#333',
    fontWeight: '600',
  },
  hintButton: {
    backgroundColor: '#fff3cd',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#ffeaa7',
    alignItems: 'center',
  },
  hintButtonText: {
    fontSize: 14,
    color: '#856404',
    fontWeight: '500',
  },
  timeLimitContainer: {
    marginTop: 12,
    alignItems: 'center',
  },
  timeLimitText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
})