import React from 'react'
import { View, Text, StyleSheet, Dimensions } from 'react-native'

const { width: screenWidth } = Dimensions.get('window')

interface PerformanceChartProps {
  data: Array<{
    label: string
    value: number
    color: string
    target?: number
  }>
  title: string
  type: 'bar' | 'line' | 'pie'
  showTarget?: boolean
}

export const PerformanceChart: React.FC<PerformanceChartProps> = ({
  data,
  title,
  type = 'bar',
  showTarget = false
}) => {
  const maxValue = Math.max(...data.map(d => d.value))
  const chartWidth = screenWidth - 64

  const renderBarChart = () => (
    <View style={styles.barChart}>
      {data.map((item, index) => (
        <View key={index} style={styles.barContainer}>
          <View style={styles.barWrapper}>
            <View 
              style={[
                styles.bar,
                { 
                  height: (item.value / maxValue) * 120,
                  backgroundColor: item.color
                }
              ]} 
            />
            {showTarget && item.target && (
              <View 
                style={[
                  styles.targetLine,
                  { bottom: (item.target / maxValue) * 120 }
                ]}
              />
            )}
          </View>
          <Text style={styles.barLabel}>{item.label}</Text>
          <Text style={styles.barValue}>{item.value.toFixed(1)}%</Text>
          {showTarget && item.target && (
            <Text style={styles.targetValue}>Target: {item.target}%</Text>
          )}
        </View>
      ))}
    </View>
  )

  const renderLineChart = () => {
    const points = data.map((item, index) => ({
      x: (index / (data.length - 1)) * (chartWidth - 40),
      y: 120 - (item.value / maxValue) * 120
    }))

    return (
      <View style={styles.lineChart}>
        <View style={styles.lineChartContainer}>
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map((value, index) => (
            <View 
              key={index}
              style={[
                styles.gridLine,
                { bottom: (value / 100) * 120 }
              ]}
            />
          ))}
          
          {/* Data points */}
          {points.map((point, index) => (
            <View
              key={index}
              style={[
                styles.dataPoint,
                {
                  left: point.x + 20,
                  bottom: point.y,
                  backgroundColor: data[index].color
                }
              ]}
            />
          ))}
          
          {/* Labels */}
          <View style={styles.lineLabels}>
            {data.map((item, index) => (
              <View key={index} style={styles.lineLabelContainer}>
                <Text style={styles.lineLabel}>{item.label}</Text>
                <Text style={styles.lineValue}>{item.value.toFixed(1)}%</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    )
  }

  const renderPieChart = () => {
    const total = data.reduce((sum, item) => sum + item.value, 0)
    let currentAngle = 0

    return (
      <View style={styles.pieChart}>
        <View style={styles.pieContainer}>
          {data.map((item, index) => {
            const percentage = (item.value / total) * 100
            const angle = (item.value / total) * 360
            const nextAngle = currentAngle + angle
            
            const result = (
              <View
                key={index}
                style={[
                  styles.pieSlice,
                  {
                    transform: [{ rotate: `${currentAngle}deg` }],
                    backgroundColor: item.color,
                  }
                ]}
              />
            )
            
            currentAngle = nextAngle
            return result
          })}
        </View>
        
        <View style={styles.pieLegend}>
          {data.map((item, index) => (
            <View key={index} style={styles.legendItem}>
              <View 
                style={[
                  styles.legendColor,
                  { backgroundColor: item.color }
                ]} 
              />
              <Text style={styles.legendText}>
                {item.label}: {((item.value / total) * 100).toFixed(1)}%
              </Text>
            </View>
          ))}
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      
      {type === 'bar' && renderBarChart()}
      {type === 'line' && renderLineChart()}
      {type === 'pie' && renderPieChart()}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  
  // Bar Chart Styles
  barChart: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 180,
  },
  barContainer: {
    alignItems: 'center',
    flex: 1,
    position: 'relative',
  },
  barWrapper: {
    height: 120,
    justifyContent: 'flex-end',
    marginBottom: 8,
    position: 'relative',
  },
  bar: {
    width: 24,
    borderRadius: 12,
    minHeight: 4,
  },
  targetLine: {
    position: 'absolute',
    left: -4,
    right: -4,
    height: 2,
    backgroundColor: '#dc3545',
    borderRadius: 1,
  },
  barLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginBottom: 4,
  },
  barValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  targetValue: {
    fontSize: 10,
    color: '#dc3545',
    textAlign: 'center',
    marginTop: 2,
  },
  
  // Line Chart Styles
  lineChart: {
    height: 180,
  },
  lineChartContainer: {
    height: 120,
    position: 'relative',
    marginBottom: 20,
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#e9ecef',
  },
  dataPoint: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#fff',
  },
  lineLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  lineLabelContainer: {
    alignItems: 'center',
  },
  lineLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  lineValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
  },
  
  // Pie Chart Styles
  pieChart: {
    alignItems: 'center',
  },
  pieContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    marginBottom: 20,
    position: 'relative',
  },
  pieSlice: {
    position: 'absolute',
    width: '50%',
    height: '50%',
    top: 0,
    left: '50%',
    transformOrigin: '0 100%',
  },
  pieLegend: {
    alignItems: 'flex-start',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendText: {
    fontSize: 14,
    color: '#333',
  },
})

export default PerformanceChart