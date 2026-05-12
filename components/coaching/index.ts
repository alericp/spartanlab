// Coaching Components - Knowledge Bubbles and Micro-Explanations

export {
  KnowledgeBubble,
  InfoBubble,
  ExerciseKnowledgeBubble,
  ProtocolKnowledgeBubble,
  StructureKnowledgeBubble,
  ProgressionKnowledgeBubble,
  ReadinessKnowledgeBubble,
  OverrideWarningBubble,
  CoachingInsightBubble,
  MethodInfoBubble,
  // [AB8.6] Type and guard for MethodInfoBubble consumers
  isMethodInfoBubbleMethodType,
} from './KnowledgeBubble'

// [AB8.6] Export type for use by Program card and Live Workout
export type { MethodInfoBubbleMethodType } from './KnowledgeBubble'
