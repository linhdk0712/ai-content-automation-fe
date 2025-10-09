import { ScheduledPost } from '@/types/scheduling'
import React from 'react'
import BulkScheduler from './BulkScheduler'
import CalendarView from './CalendarView'
import OptimalTimeAnalyzer from './OptimalTimeAnalyzer'
import RecurringPostManager from './RecurringPostManager'
import ScheduleManager from './ScheduleManager'
import SchedulingConflictResolver from './SchedulingConflictResolver'

export type SchedulingSuiteSection =
  | 'manager'
  | 'calendar'
  | 'bulk'
  | 'optimal-time'
  | 'recurring'
  | 'conflicts'

interface SchedulingSuiteProps {
  active?: SchedulingSuiteSection
}

const SchedulingSuite: React.FC<SchedulingSuiteProps> = ({ active = 'manager' }) => {
  switch (active) {
    case 'calendar':
      return <CalendarView scheduledPosts={[]} onCreatePost={function (): void {
          throw new Error('Function not implemented.')
      } } onUpdatePost={function (): void {
          throw new Error('Function not implemented.')
      } } onDeletePost={function (): void {
          throw new Error('Function not implemented.')
      } } />
    case 'bulk':
      return <BulkScheduler open={false} onClose={function (): void {
          throw new Error('Function not implemented.')
      } } />
    case 'optimal-time':
      return <OptimalTimeAnalyzer open={false} onClose={function (): void {
          throw new Error('Function not implemented.')
      } } platforms={[]} />
    case 'recurring':
      return <RecurringPostManager open={false} onClose={function (): void {
          throw new Error('Function not implemented.')
      } } />
    case 'conflicts':
      return <SchedulingConflictResolver />
    case 'manager':
    default:
      return <ScheduleManager />
  }
}

export default SchedulingSuite


