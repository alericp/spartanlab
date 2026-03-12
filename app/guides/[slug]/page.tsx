import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ArrowRight, Target, Dumbbell, Trophy, Zap, GraduationCap, CheckCircle2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

// Comprehensive guide content for SEO
const GUIDES: Record<string, {
  title: string
  metaTitle: string
  metaDescription: string
  icon: typeof Target
  category: string
  intro: string
  sections: {
    h2: string
    content: string
    list?: string[]
    table?: { level: string; benchmark: string; notes: string }[]
  }[]
  toolSlug: string
  toolName: string
  relatedGuides: string[]
}> = {
  'front-lever-progression': {
    title: 'Front Lever Progression Guide',
    metaTitle: 'Front Lever Progression Guide + Tracker | SpartanLab',
    metaDescription: 'Complete front lever progression guide with levels explained, hold time benchmarks, and prerequisite strength standards. Track your progress with the free SpartanLab sensor.',
    icon: Target,
    category: 'Skill Progression',
    intro: 'The front lever is one of the most impressive static holds in calisthenics. This guide breaks down the progression levels, hold time requirements, and prerequisite strength needed to master each stage from tuck to full front lever.',
    sections: [
      {
        h2: 'Front Lever Progression Levels',
        content: 'The front lever follows a systematic progression that gradually increases the lever arm length, requiring progressively more pulling strength and core stability.',
        table: [
          { level: 'Tuck Front Lever', benchmark: '10-20 second hold', notes: 'Knees tucked tight to chest, body horizontal' },
          { level: 'Advanced Tuck', benchmark: '8-15 second hold', notes: 'Hips extended backward, thighs below horizontal' },
          { level: 'One-Leg Front Lever', benchmark: '5-12 second hold', notes: 'One leg fully extended, one tucked' },
          { level: 'Straddle Front Lever', benchmark: '5-10 second hold', notes: 'Both legs extended, spread wide for leverage' },
          { level: 'Full Front Lever', benchmark: '3-8 second hold', notes: 'Legs together, body fully horizontal' },
        ],
      },
      {
        h2: 'How Long Should You Hold Each Front Lever Progression?',
        content: 'Quality holds trump maximum duration attempts. Clean, controlled holds build better strength than shaky attempts at longer times. Aim for the ownership benchmarks below before progressing.',
        list: [
          'Tuck Front Lever: 15-20 seconds clean holds before advancing',
          'Advanced Tuck: 10-15 seconds with proper hip extension',
          'One-Leg: 8-12 seconds each side with control',
          'Straddle: 8-10 seconds with horizontal body position',
          'Full: 5+ seconds represents solid mastery',
        ],
      },
      {
        h2: 'Prerequisites: Pulling Strength for Front Lever',
        content: 'Front lever progress correlates directly with weighted pull-up strength. If your lever progress stalls, increasing pulling strength often unlocks the next level.',
        table: [
          { level: 'Tuck Front Lever', benchmark: '+20% BW weighted pull-up', notes: '8-10 strict pull-ups minimum' },
          { level: 'Advanced Tuck', benchmark: '+35% BW weighted pull-up', notes: '12-15 strict pull-ups' },
          { level: 'Straddle Front Lever', benchmark: '+50% BW weighted pull-up', notes: 'Strong lat and scapular control' },
          { level: 'Full Front Lever', benchmark: '+65-75% BW weighted pull-up', notes: 'Elite pulling strength required' },
        ],
      },
      {
        h2: 'When to Progress to the Next Front Lever Level',
        content: 'You are ready to progress when you meet these criteria consistently:',
        list: [
          'Can perform 4+ clean holds at minimum duration for current level',
          'Holds feel controlled, not maximum effort',
          'Training the skill 2-3 times per week without joint issues',
          'Pulling strength supports the next level (see prerequisites)',
          'No excessive compensations (bent arms, hip pike, arched back)',
        ],
      },
      {
        h2: 'Common Front Lever Mistakes',
        content: 'Avoid these errors that slow progress and risk injury:',
        list: [
          'Attempting harder progressions before owning easier ones',
          'Neglecting scapular depression and retraction strength',
          'Training to failure every session instead of quality holds',
          'Ignoring weighted pulling strength development',
          'Poor body tension leading to hip pike or arch',
          'Insufficient rest between front lever training sessions',
        ],
      },
      {
        h2: 'Best Exercises for Front Lever Progress',
        content: 'These supplementary exercises build the specific strength needed for front lever development:',
        list: [
          'Front Lever Rows - horizontal pulling strength in lever position',
          'Weighted Pull-Ups - foundational pulling strength',
          'Ice Cream Makers - dynamic front lever strength',
          'Scapular Pull-Ups - scapular depression control',
          'Dragon Flags - core anti-extension strength',
          'Tuck Front Lever Raises - transition strength',
        ],
      },
    ],
    toolSlug: 'front-lever-calculator',
    toolName: 'Front Lever Progression Calculator',
    relatedGuides: ['calisthenics-strength-standards', 'weighted-pull-up-standards'],
  },
  'planche-progression': {
    title: 'Planche Progression Guide',
    metaTitle: 'Planche Progression Guide + Tracker | SpartanLab',
    metaDescription: 'Complete planche progression guide with levels, hold time benchmarks, and pushing strength prerequisites. Track your planche journey with the free SpartanLab sensor.',
    icon: Target,
    category: 'Skill Progression',
    intro: 'The planche is among the most challenging static holds in calisthenics, requiring exceptional shoulder strength and body tension. This guide covers the complete progression from tuck planche to full planche with realistic benchmarks.',
    sections: [
      {
        h2: 'Planche Progression Levels',
        content: 'Each planche progression increases the moment arm your shoulders must overcome, requiring dramatically more pushing strength and anterior deltoid development.',
        table: [
          { level: 'Tuck Planche', benchmark: '8-15 second hold', notes: 'Knees tucked, hips level with shoulders' },
          { level: 'Advanced Tuck Planche', benchmark: '6-12 second hold', notes: 'Hips extended backward, back flat' },
          { level: 'Straddle Planche', benchmark: '5-10 second hold', notes: 'Legs spread wide, body horizontal' },
          { level: 'Full Planche', benchmark: '3-8 second hold', notes: 'Legs together, elite-level achievement' },
        ],
      },
      {
        h2: 'Planche Hold Time Benchmarks',
        content: 'Always prioritize proper lean and full scapular protraction over hold duration. A 5-second hold with correct position beats a 15-second hold with poor form.',
        list: [
          'Tuck Planche: Master 12-15 second holds with full protraction',
          'Advanced Tuck: 10-12 seconds with hips extended, back flat',
          'Straddle: 8-10 seconds with body parallel to ground',
          'Full Planche: 5+ seconds represents exceptional achievement',
        ],
      },
      {
        h2: 'Prerequisites: Pushing Strength for Planche',
        content: 'Planche demands serious pushing strength. Most athletes significantly underestimate the requirements. Weighted dip strength is the best predictor of planche potential.',
        table: [
          { level: 'Tuck Planche', benchmark: '+25% BW weighted dip', notes: '20+ strict dips' },
          { level: 'Advanced Tuck Planche', benchmark: '+40% BW weighted dip', notes: 'Deep pseudo planche push-ups' },
          { level: 'Straddle Planche', benchmark: '+55-65% BW weighted dip', notes: 'Strong planche lean capacity' },
          { level: 'Full Planche', benchmark: '+75-90% BW weighted dip', notes: 'Elite pushing strength' },
        ],
      },
      {
        h2: 'Planche Lean Progressions',
        content: 'The planche lean is the foundational exercise for planche development. Progress through these lean angles before attempting static holds.',
        list: [
          'Beginner lean: Shoulders slightly past wrists (15-20 degree forward)',
          'Intermediate lean: Shoulders well past wrists (30-40 degree)',
          'Advanced lean: Shoulders approaching tuck planche position (45+ degree)',
          'Hold lean positions for 30-60 seconds before progressing',
        ],
      },
      {
        h2: 'Common Planche Mistakes',
        content: 'These errors prevent progress and increase injury risk:',
        list: [
          'Insufficient planche lean - shoulders not far enough forward',
          'Scapular depression instead of protraction',
          'Attempting straddle before owning advanced tuck',
          'Neglecting weighted pushing strength development',
          'Poor wrist preparation and mobility',
          'Training too frequently without adequate recovery',
        ],
      },
      {
        h2: 'Best Exercises for Planche Progress',
        content: 'Build planche-specific strength with these exercises:',
        list: [
          'Planche Lean Push-Ups - pushing strength at lean angle',
          'Weighted Dips - foundational pushing power',
          'Pseudo Planche Push-Ups - deep ROM in lean position',
          'Tuck Planche Push-Ups - dynamic planche strength',
          'L-Sit to Tuck Planche transitions - control and compression',
          'Maltese presses (band assisted) - straight arm strength',
        ],
      },
    ],
    toolSlug: 'planche-readiness',
    toolName: 'Planche Readiness Test',
    relatedGuides: ['calisthenics-strength-standards', 'front-lever-progression'],
  },
  'calisthenics-strength-standards': {
    title: 'Calisthenics Strength Standards',
    metaTitle: 'Calisthenics Strength Standards: Beginner to Elite | SpartanLab',
    metaDescription: 'Complete calisthenics strength standards from beginner to elite. Benchmark your pulling and pushing strength against proven standards that correlate with skill acquisition.',
    icon: Trophy,
    category: 'Strength',
    intro: 'Understanding where your strength sits relative to established standards helps you set realistic goals and identify training priorities. These standards are based on strict form and correlate with advanced skill acquisition.',
    sections: [
      {
        h2: 'Pulling Strength Standards',
        content: 'Pulling strength forms the foundation of many advanced skills including front lever, muscle-up, and one-arm chin-up progressions.',
        table: [
          { level: 'Beginner', benchmark: '1-5 strict pull-ups', notes: 'Focus on form and full ROM' },
          { level: 'Novice', benchmark: '5-10 strict pull-ups', notes: 'Ready for weighted pull-up training' },
          { level: 'Intermediate', benchmark: '12+ pull-ups or +25% BW weighted', notes: 'Tuck front lever, muscle-up potential' },
          { level: 'Advanced', benchmark: '20+ pull-ups or +50% BW weighted', notes: 'Straddle FL, one-arm chin negatives' },
          { level: 'Elite', benchmark: '+75-100% BW weighted pull-up', notes: 'Full front lever, one-arm chin-up' },
        ],
      },
      {
        h2: 'Pushing Strength Standards',
        content: 'Pushing strength supports planche, handstand push-up, and ring work. Weighted dip strength is the best benchmark.',
        table: [
          { level: 'Beginner', benchmark: '20+ push-ups, 1-5 dips', notes: 'Building foundational strength' },
          { level: 'Novice', benchmark: '30+ push-ups, 10+ dips', notes: 'Ready for weighted dip training' },
          { level: 'Intermediate', benchmark: '+25% BW weighted dips', notes: 'Tuck planche, wall HSPU potential' },
          { level: 'Advanced', benchmark: '+50% BW weighted dips', notes: 'Straddle planche, freestanding HSPU' },
          { level: 'Elite', benchmark: '+75-90% BW weighted dips', notes: 'Full planche, one-arm push-up' },
        ],
      },
      {
        h2: 'Core Strength Standards',
        content: 'Core strength bridges upper body strength to skill execution. These benchmarks indicate readiness for advanced static holds.',
        list: [
          'Beginner: 30 second plank, 10 leg raises',
          'Novice: 60 second plank, tuck L-sit on ground',
          'Intermediate: 15+ second floor L-sit, 5 dragon flag negatives',
          'Advanced: 30+ second L-sit, 8+ controlled dragon flags',
          'Elite: V-sit holds, full manna progressions',
        ],
      },
      {
        h2: 'How Standards Relate to Skills',
        content: 'These approximate correlations help predict skill acquisition potential:',
        list: [
          'Tuck Front Lever: Intermediate pulling (+25-35% BW pull-up)',
          'Full Front Lever: Advanced/Elite pulling (+65-75% BW pull-up)',
          'Tuck Planche: Intermediate pushing (+25-35% BW dip)',
          'Full Planche: Elite pushing (+75-90% BW dip)',
          'Strict Muscle-Up: Strong intermediate pulling + explosiveness',
          'Freestanding HSPU: Advanced pushing + balance skills',
        ],
      },
      {
        h2: 'Testing Your Standards',
        content: 'For accurate assessment, test with these protocols:',
        list: [
          'Pull-ups: Dead hang start, chin clearly over bar, full extension between reps',
          'Weighted pull-ups: Same form, test 3-5RM and calculate estimated 1RM',
          'Dips: Full lockout, shoulders below elbows at bottom',
          'Weighted dips: Same form, test 3-5RM for 1RM estimation',
          'Always use consistent form for tracking progress',
        ],
      },
    ],
    toolSlug: 'strength-standards',
    toolName: 'Calisthenics Strength Standards Tool',
    relatedGuides: ['weighted-pull-up-standards', 'front-lever-progression', 'planche-progression'],
  },
  'weighted-pull-up-standards': {
    title: 'Weighted Pull-Up Standards',
    metaTitle: 'Weighted Pull-Up Standards for Calisthenics | SpartanLab',
    metaDescription: 'Weighted pull-up strength standards that predict calisthenics skill acquisition. Learn the benchmarks needed for front lever, muscle-up, and one-arm chin-up.',
    icon: Dumbbell,
    category: 'Strength',
    intro: 'Weighted pull-up strength is the single best predictor of advanced calisthenics pulling skill acquisition. Athletes who prioritize building this foundation progress faster through front lever, muscle-up, and one-arm chin-up training.',
    sections: [
      {
        h2: 'Weighted Pull-Up Strength Standards',
        content: 'These standards use relative strength (added weight as percentage of bodyweight) for accurate comparison across different body sizes.',
        table: [
          { level: 'Beginner', benchmark: 'Bodyweight to +10%', notes: '5-8 strict pull-ups' },
          { level: 'Intermediate', benchmark: '+25-40% BW', notes: '10-15 strict pull-ups, tuck FL potential' },
          { level: 'Advanced', benchmark: '+50-70% BW', notes: 'Straddle FL, muscle-up, OAC negatives' },
          { level: 'Elite', benchmark: '+80-100%+ BW', notes: 'Full FL, one-arm chin-up' },
        ],
      },
      {
        h2: 'Why Weighted Pull-Up Strength Matters',
        content: 'Research and practical experience show strong correlations between weighted pull-up strength and skill acquisition speed:',
        list: [
          'Athletes with +50% BW pull-ups typically unlock front lever progressions faster',
          'Those with +70%+ often have the foundation for full front lever',
          'One-arm chin-up training becomes realistic at +75-80% BW',
          'Building this strength is one of the most transferable investments in calisthenics',
        ],
      },
      {
        h2: 'How to Test Your Weighted Pull-Up Max',
        content: 'Follow this protocol for accurate and consistent testing:',
        list: [
          'Warm up thoroughly with bodyweight pull-ups',
          'Use a dip belt or weighted vest for consistent loading',
          'Test 3-5 rep max rather than true 1RM for safety',
          'Calculate estimated 1RM: Weight x (1 + 0.033 x Reps)',
          'Test consistently (same time of day, similar conditions)',
          'Retest every 4-6 weeks to track progress',
        ],
      },
      {
        h2: 'Weighted Pull-Up Programming',
        content: 'Build weighted pull-up strength efficiently with these approaches:',
        list: [
          'Train weighted pull-ups 2-3 times per week',
          'Use 3-6 rep ranges for strength focus',
          'Progress by adding 2.5-5 lbs when you hit top of rep range',
          'Include both weighted work and bodyweight volume',
          'Deload every 4-6 weeks to manage fatigue',
          'Prioritize form over ego weights',
        ],
      },
      {
        h2: 'Weighted Pull-Up to Skill Correlations',
        content: 'Use these approximate benchmarks to predict skill readiness:',
        table: [
          { level: 'Tuck Front Lever', benchmark: '+20-35% BW pull-up', notes: 'Entry point for lever training' },
          { level: 'Advanced Tuck FL', benchmark: '+35-45% BW pull-up', notes: 'Solid lever foundation' },
          { level: 'Straddle Front Lever', benchmark: '+50-60% BW pull-up', notes: 'Strong pulling base' },
          { level: 'Full Front Lever', benchmark: '+65-75% BW pull-up', notes: 'Advanced strength required' },
          { level: 'One-Arm Chin-Up', benchmark: '+75-85% BW pull-up', notes: 'Elite level foundation' },
        ],
      },
    ],
    toolSlug: 'weighted-pullup-calculator',
    toolName: 'Weighted Pull-Up Calculator',
    relatedGuides: ['calisthenics-strength-standards', 'front-lever-progression'],
  },
  'muscle-up-progression': {
    title: 'Muscle-Up Progression Guide',
    metaTitle: 'Muscle-Up Progression Guide: From First Rep to Weighted | SpartanLab',
    metaDescription: 'Complete muscle-up progression guide with prerequisites, technique breakdown, and training recommendations. Track your progress with the SpartanLab muscle-up sensor.',
    icon: Zap,
    category: 'Skill Progression',
    intro: 'The muscle-up combines pulling strength with an explosive transition phase. This guide covers everything from prerequisites to your first strict rep and beyond to weighted muscle-ups.',
    sections: [
      {
        h2: 'Muscle-Up Progression Path',
        content: 'Progress through these stages systematically for safe and effective muscle-up development.',
        table: [
          { level: 'Band Assisted', benchmark: 'Controlled reps with band', notes: 'Learn movement pattern safely' },
          { level: 'Jumping Muscle-Up', benchmark: 'Box-assisted transitions', notes: 'Build transition strength' },
          { level: 'Kipping Muscle-Up', benchmark: 'Swing for momentum', notes: 'First unassisted muscle-ups' },
          { level: 'Strict Muscle-Up', benchmark: 'No kip, controlled transition', notes: 'True strength muscle-up' },
          { level: 'Weighted Muscle-Up', benchmark: 'Added load', notes: 'Elite level achievement' },
        ],
      },
      {
        h2: 'Prerequisites for Your First Strict Muscle-Up',
        content: 'These benchmarks indicate readiness to begin strict muscle-up training:',
        list: [
          '12-15 strict pull-ups with chest to bar',
          '20+ strict dips with good ROM',
          '+35-50% BW weighted pull-up',
          'Ability to perform high pulls (chin to chest level)',
          'Basic false grip hold capacity',
          'Strong explosive pulling power',
        ],
      },
      {
        h2: 'The Transition: Key to the Muscle-Up',
        content: 'The transition phase is where most athletes struggle. Master these elements:',
        list: [
          'False grip: Wrists over the bar for shorter lever arm',
          'High pull: Pull explosively to sternum level, not just chin',
          'Lean forward: Shift torso over the bar during transition',
          'Quick elbows: Rotate elbows behind you rapidly',
          'Stay tight: Core tension prevents swinging',
        ],
      },
      {
        h2: 'Common Muscle-Up Mistakes',
        content: 'Avoid these errors that prevent progress:',
        list: [
          'Pulling to chin level only - need sternum height',
          'Losing tension and swinging during transition',
          'Kipping too aggressively (injury risk)',
          'Neglecting weighted pulling strength',
          'Not learning false grip for bar muscle-ups',
          'Skipping dip strength development',
        ],
      },
      {
        h2: 'Best Exercises for Muscle-Up Progress',
        content: 'Build muscle-up specific strength with these exercises:',
        list: [
          'High Pulls - explosive pulling to sternum height',
          'Weighted Pull-Ups - raw pulling power',
          'Transition Negatives - eccentric strength through transition',
          'Russian Dips - deep dip strength needed for catch',
          'False Grip Hangs - grip endurance and positioning',
          'Jumping Muscle-Ups - pattern practice with assistance',
        ],
      },
    ],
    toolSlug: 'muscle-up-progression',
    toolName: 'Muscle-Up Progression Calculator',
    relatedGuides: ['weighted-pull-up-standards', 'calisthenics-strength-standards'],
  },
  'calisthenics-training-program': {
    title: 'Calisthenics Training Program Guide',
    metaTitle: 'How to Structure Your Calisthenics Training Program | SpartanLab',
    metaDescription: 'Learn how to structure an effective calisthenics training program. Programming principles, frequency guidelines, and progression strategies that work.',
    icon: GraduationCap,
    category: 'Programming',
    intro: 'Effective calisthenics programming balances skill work, strength training, and recovery. This guide covers the principles behind programs that produce consistent progress.',
    sections: [
      {
        h2: 'Calisthenics Program Structure',
        content: 'A well-structured calisthenics program includes these components:',
        list: [
          'Skill Work: Practice specific skills when fresh (front lever, planche, HSPU)',
          'Strength Work: Build foundational strength (weighted pull-ups, dips)',
          'Accessory Work: Address weak points and prevent imbalances',
          'Mobility/Flexibility: Maintain range of motion for skill positions',
          'Rest and Recovery: Adequate time between hard sessions',
        ],
      },
      {
        h2: 'Training Frequency Guidelines',
        content: 'Optimal frequency depends on training experience and goals:',
        table: [
          { level: 'Beginner', benchmark: '3x per week full body', notes: 'Focus on movement quality' },
          { level: 'Intermediate', benchmark: '4x per week (Upper/Lower or Push/Pull)', notes: 'Add specialization' },
          { level: 'Advanced', benchmark: '5-6x per week (specialized splits)', notes: 'High volume, targeted focus' },
        ],
      },
      {
        h2: 'Skill vs Strength Priority',
        content: 'Balance skill practice and strength building based on your goals:',
        list: [
          'Skill Priority: Practice skills when fresh, early in session',
          'Strength Priority: Build weighted strength to unlock skills faster',
          'Maintenance: Keep inactive skills with minimal volume',
          'Greasing the Groove: Multiple brief skill practice sessions daily',
        ],
      },
      {
        h2: 'Progressive Overload in Calisthenics',
        content: 'Progress in calisthenics through multiple variables:',
        list: [
          'Add weight (weighted pull-ups, dips)',
          'Progress to harder variation (tuck to advanced tuck)',
          'Increase hold time (5 seconds to 8 seconds)',
          'Add reps within a set',
          'Add sets within a session',
          'Decrease rest between sets',
          'Increase range of motion',
        ],
      },
      {
        h2: 'Sample Training Week Structure',
        content: 'Example intermediate 4-day structure:',
        list: [
          'Day 1 (Pull Focus): Front lever practice, weighted pull-ups, rows',
          'Day 2 (Push Focus): Planche practice, weighted dips, push-ups',
          'Day 3: Rest or light mobility',
          'Day 4 (Pull Focus): Muscle-up practice, pull-up variations, curls',
          'Day 5 (Push Focus): HSPU practice, dip variations, tricep work',
          'Day 6-7: Rest, light skill practice if recovered',
        ],
      },
      {
        h2: 'Managing Fatigue and Deloads',
        content: 'Prevent overtraining with smart fatigue management:',
        list: [
          'Track training momentum - consistency beats intensity',
          'Deload every 4-6 weeks (reduce volume 40-50%)',
          'Watch for signs of overtraining: strength regression, poor sleep, joint aches',
          'Periodize intensity: not every session should be maximum effort',
          'Active recovery: light movement on rest days aids recovery',
        ],
      },
    ],
    toolSlug: 'strength-standards',
    toolName: 'SpartanLab Training Dashboard',
    relatedGuides: ['calisthenics-strength-standards', 'front-lever-progression', 'planche-progression'],
  },
  'calisthenics-periodization': {
    title: 'Calisthenics Periodization Guide',
    metaTitle: 'Calisthenics Periodization: How to Structure Training Cycles | SpartanLab',
    metaDescription: 'Learn periodization strategies for calisthenics training. Understand mesocycles, deload timing, and how to structure skill and strength blocks for optimal progress.',
    icon: GraduationCap,
    category: 'Programming',
    intro: 'Periodization organizes your training into structured cycles that build toward peak performance while managing fatigue. This guide covers how to periodize calisthenics training for consistent long-term progress.',
    sections: [
      {
        h2: 'What is Periodization?',
        content: 'Periodization is the systematic planning of training cycles. Instead of training the same way forever, you strategically vary volume, intensity, and focus areas over time. This prevents plateaus, manages fatigue, and builds toward specific goals.',
        list: [
          'Macrocycle: Long-term plan (3-12 months) with overall goals',
          'Mesocycle: Medium-term block (3-6 weeks) with specific focus',
          'Microcycle: Weekly structure with day-to-day programming',
        ],
      },
      {
        h2: 'Linear Periodization for Calisthenics',
        content: 'Linear periodization progressively increases intensity while decreasing volume over a training block. Effective for strength-focused phases.',
        table: [
          { level: 'Week 1-2', benchmark: 'High volume, moderate intensity', notes: '4x8-10 reps, RPE 7' },
          { level: 'Week 3-4', benchmark: 'Moderate volume, higher intensity', notes: '4x5-6 reps, RPE 8' },
          { level: 'Week 5-6', benchmark: 'Low volume, high intensity', notes: '5x3-4 reps, RPE 9' },
          { level: 'Week 7', benchmark: 'Deload', notes: '50% volume, RPE 6' },
        ],
      },
      {
        h2: 'Block Periodization for Skill Acquisition',
        content: 'Block periodization focuses on one primary quality per mesocycle, which works well for calisthenics skill development.',
        list: [
          'Accumulation Block (4-6 weeks): High volume, build work capacity',
          'Transmutation Block (3-4 weeks): Convert general strength to skill-specific',
          'Realization Block (1-2 weeks): Peak performance, reduced volume',
          'Rotate skill focus each macro block to maintain multiple skills',
        ],
      },
      {
        h2: 'When and How to Deload',
        content: 'Deloads are planned recovery periods that reduce fatigue while maintaining fitness. Most athletes need deloads every 4-6 weeks of hard training.',
        list: [
          'Reduce volume by 40-50% (fewer sets, not lighter progressions)',
          'Maintain intensity to preserve strength adaptations',
          'Keep skill practice but reduce hold times',
          'Focus on mobility and recovery work',
          'Signs you need a deload: regression, joint pain, poor sleep, motivation loss',
        ],
      },
      {
        h2: 'Periodizing Multiple Skills',
        content: 'When training multiple skills, prioritize one while maintaining others:',
        table: [
          { level: 'Priority Skill', benchmark: '3x per week, progressive', notes: 'Primary focus for the block' },
          { level: 'Secondary Skill', benchmark: '2x per week, moderate', notes: 'Slow progress, avoid regression' },
          { level: 'Maintenance Skill', benchmark: '1x per week, minimum', notes: 'Prevent skill loss only' },
        ],
      },
      {
        h2: 'Sample 12-Week Periodization Plan',
        content: 'Example periodization for someone focusing on front lever with planche maintenance:',
        list: [
          'Weeks 1-4: Front lever accumulation (high volume FL work, maintain planche)',
          'Weeks 5-8: Front lever intensification (harder progressions, less volume)',
          'Week 9: Deload (reduced everything)',
          'Weeks 10-12: Front lever realization (test maxes, peak holds)',
          'Then rotate: planche becomes priority, front lever goes to maintenance',
        ],
      },
      {
        h2: 'Autoregulation: Adjusting Based on Readiness',
        content: 'Rigid periodization does not account for life stress. Use autoregulation to adjust daily training based on readiness:',
        list: [
          'Track RPE (Rate of Perceived Exertion) to gauge recovery',
          'If RPE for warm-up sets is high, reduce planned volume',
          'If feeling great, add an extra set or harder progression',
          'SpartanLab Adaptive Engine does this automatically based on your logs',
        ],
      },
    ],
    toolSlug: 'calisthenics-program-builder',
    toolName: 'Calisthenics Program Builder',
    relatedGuides: ['calisthenics-training-program', 'calisthenics-strength-standards'],
  },
  'hspu-progression': {
    title: 'Handstand Push-Up Progression Guide',
    metaTitle: 'Handstand Push-Up (HSPU) Progression Guide | SpartanLab',
    metaDescription: 'Complete HSPU progression guide from wall-supported to freestanding. Learn prerequisites, progression levels, and training tips for handstand push-ups.',
    icon: Target,
    category: 'Skill Progression',
    intro: 'The handstand push-up combines overhead pressing strength with balance and body control. This guide covers the complete progression from wall-supported HSPU to freestanding reps.',
    sections: [
      {
        h2: 'HSPU Progression Levels',
        content: 'HSPU progression develops both pressing strength and handstand control simultaneously.',
        table: [
          { level: 'Wall HSPU (Back to Wall)', benchmark: '8-12 reps', notes: 'Heels on wall, full ROM' },
          { level: 'Wall HSPU (Chest to Wall)', benchmark: '6-10 reps', notes: 'Harder balance, stricter form' },
          { level: 'Deficit Wall HSPU', benchmark: '5-8 reps', notes: 'Increased ROM, more strength' },
          { level: 'Freestanding HSPU', benchmark: '3-5 reps', notes: 'No wall support, elite level' },
        ],
      },
      {
        h2: 'Prerequisites for HSPU Training',
        content: 'Build these foundations before serious HSPU work:',
        list: [
          '30+ second wall handstand hold (either orientation)',
          '15+ pike push-ups with elevated feet',
          '+30% BW weighted dips (pressing strength foundation)',
          'Good shoulder mobility (arms overhead, neutral spine)',
          'Strong core control in hollow body position',
        ],
      },
      {
        h2: 'Wall HSPU Technique',
        content: 'Master wall HSPU form before progressing:',
        list: [
          'Kick up to wall handstand, hands shoulder-width or slightly wider',
          'Lower under control until head gently touches ground',
          'Press up without losing hollow body position',
          'Full lockout at top, shoulders elevated',
          'Avoid excessive arch - maintain core tension',
        ],
      },
      {
        h2: 'Common HSPU Mistakes',
        content: 'These errors slow progress and risk injury:',
        list: [
          'Insufficient handstand hold time before adding pressing',
          'Hands too wide or too narrow for your mobility',
          'Excessive back arch compensating for shoulder mobility',
          'Kipping or using momentum instead of controlled press',
          'Neglecting negative/eccentric control',
        ],
      },
      {
        h2: 'Best Exercises for HSPU Progress',
        content: 'Build HSPU-specific strength with these exercises:',
        list: [
          'Pike Push-Ups (elevated): Pressing strength in pike position',
          'Wall Handstand Holds: Balance and time under tension',
          'Negative HSPU: Control through the lowering phase',
          'Weighted Dips: General pressing power',
          'Z-Press: Overhead pressing without leg drive',
          'Shoulder Mobility Work: Prerequisites for safe ROM',
        ],
      },
    ],
    toolSlug: 'hspu-progression',
    toolName: 'HSPU Progression Calculator',
    relatedGuides: ['planche-progression', 'calisthenics-strength-standards'],
  },
  'front-lever-strength-requirements': {
    title: 'Front Lever Strength Requirements',
    metaTitle: 'Front Lever Strength Requirements: What You Need | SpartanLab',
    metaDescription: 'Detailed strength requirements for each front lever progression. Learn exactly how strong you need to be in weighted pull-ups, rows, and core work.',
    icon: Dumbbell,
    category: 'Strength',
    intro: 'The front lever demands serious pulling strength. This guide breaks down the exact strength benchmarks needed for each progression level, helping you identify whether strength or technique is your limiting factor.',
    sections: [
      {
        h2: 'Weighted Pull-Up Requirements',
        content: 'Weighted pull-up strength is the primary predictor of front lever ability. These benchmarks are based on strict, controlled reps.',
        table: [
          { level: 'Tuck Front Lever', benchmark: '+20-25% BW', notes: '8-10 strict pull-ups minimum' },
          { level: 'Advanced Tuck FL', benchmark: '+35-45% BW', notes: '12-15 strict pull-ups' },
          { level: 'One-Leg FL', benchmark: '+45-55% BW', notes: 'Asymmetric strength helps' },
          { level: 'Straddle FL', benchmark: '+50-60% BW', notes: 'Significant pulling power' },
          { level: 'Full Front Lever', benchmark: '+65-80% BW', notes: 'Elite pulling strength' },
        ],
      },
      {
        h2: 'Horizontal Pulling Strength',
        content: 'Row strength complements vertical pulling for front lever development:',
        list: [
          'Bodyweight rows: 20+ controlled reps (basic foundation)',
          'Feet-elevated rows: 15+ reps with full ROM',
          'Front lever rows (tuck): 5-8 reps before advancing',
          'Weighted inverted rows: +25% BW for straddle readiness',
        ],
      },
      {
        h2: 'Core Strength Requirements',
        content: 'Anti-extension core strength prevents hip pike during the lever:',
        list: [
          'Hollow body hold: 30-45 seconds (tuck FL)',
          'Dragon flag negatives: 5+ controlled reps (advanced tuck)',
          'Full dragon flags: 5-8 reps (straddle FL)',
          'Hanging leg raises: 10+ controlled reps to horizontal',
        ],
      },
      {
        h2: 'Scapular Strength',
        content: 'Scapular depression and retraction are critical for maintaining lever position:',
        list: [
          'Scapular pull-ups: 10-15 controlled reps',
          'Active hang: 30+ seconds maintaining depression',
          'Front lever raises: Controlled from hang to tuck position',
          'These often limit athletes more than raw pulling strength',
        ],
      },
      {
        h2: 'Testing Your Readiness',
        content: 'Use these tests to determine if strength or technique is limiting you:',
        list: [
          'If weighted pull-up meets benchmark but lever stalls: Work scapular/technique',
          'If lever crumbles at hips: Core anti-extension is weak',
          'If arms bend during hold: Pulling strength insufficient',
          'If shoulders elevate: Scapular depression needs work',
        ],
      },
    ],
    toolSlug: 'front-lever-calculator',
    toolName: 'Front Lever Strength Calculator',
    relatedGuides: ['front-lever-progression', 'weighted-pull-up-standards'],
  },
  'planche-strength-requirements': {
    title: 'Planche Strength Requirements',
    metaTitle: 'Planche Strength Requirements: Complete Benchmarks | SpartanLab',
    metaDescription: 'Detailed strength requirements for each planche progression. Learn the weighted dip, push-up, and shoulder strength needed for planche.',
    icon: Dumbbell,
    category: 'Strength',
    intro: 'The planche requires exceptional pushing strength, particularly in the anterior deltoids. This guide details the strength benchmarks needed for each progression level.',
    sections: [
      {
        h2: 'Weighted Dip Requirements',
        content: 'Weighted dip strength is the best predictor of planche potential. These are strict, parallel bar dips.',
        table: [
          { level: 'Planche Lean (45 deg)', benchmark: '+15-25% BW', notes: '15+ strict dips' },
          { level: 'Tuck Planche', benchmark: '+25-35% BW', notes: '20+ strict dips' },
          { level: 'Advanced Tuck Planche', benchmark: '+40-50% BW', notes: 'Deep dip strength' },
          { level: 'Straddle Planche', benchmark: '+55-70% BW', notes: 'Significant pressing power' },
          { level: 'Full Planche', benchmark: '+75-90%+ BW', notes: 'Elite level strength' },
        ],
      },
      {
        h2: 'Pseudo Planche Push-Up Strength',
        content: 'PPPU strength directly correlates with planche holds:',
        list: [
          'Basic lean PPPU: 15-20 reps (tuck planche readiness)',
          'Deep lean PPPU: 12-15 reps (advanced tuck)',
          'Weighted PPPU (+10% BW): 8-10 reps (straddle approach)',
          'Lean angle should match target planche position',
        ],
      },
      {
        h2: 'Straight Arm Strength',
        content: 'Planche demands straight arm pushing strength, different from bent arm pressing:',
        list: [
          'Planche lean hold: 30-60 seconds (foundation)',
          'Tuck planche push-ups: 5-8 reps (tuck mastery)',
          'Maltese presses (band assisted): Build SAS capacity',
          'L-sit to tuck planche transitions: Dynamic control',
        ],
      },
      {
        h2: 'Core and Compression',
        content: 'Hollow body strength maintains planche position:',
        list: [
          'Hollow body hold: 60+ seconds (basic foundation)',
          'Hollow body rocks: 20+ controlled reps',
          'Compression work: Pike sits, V-up variations',
          'Strong compression prevents hip drop in planche',
        ],
      },
      {
        h2: 'Wrist and Shoulder Health',
        content: 'Joint preparation is critical for planche longevity:',
        list: [
          'Wrist conditioning: Daily stretches and circles',
          'Shoulder mobility: Full flexion overhead',
          'Gradual lean progression: Avoid overloading too fast',
          'Most planche injuries come from insufficient preparation',
        ],
      },
    ],
    toolSlug: 'planche-readiness',
    toolName: 'Planche Strength Calculator',
    relatedGuides: ['planche-progression', 'calisthenics-strength-standards'],
  },
  'muscle-up-strength-requirements': {
    title: 'Muscle-Up Strength Requirements',
    metaTitle: 'Muscle-Up Strength Requirements: Pull & Push Benchmarks | SpartanLab',
    metaDescription: 'Detailed strength requirements for strict muscle-ups. Learn the pulling, pushing, and explosive power needed for bar and ring muscle-ups.',
    icon: Dumbbell,
    category: 'Strength',
    intro: 'The muscle-up combines pulling strength, transition power, and dip strength. This guide breaks down each strength component needed for your first strict muscle-up and beyond.',
    sections: [
      {
        h2: 'Pulling Strength Requirements',
        content: 'High pull capacity is the foundation of muscle-up ability:',
        table: [
          { level: 'Kipping Muscle-Up', benchmark: '8-10 pull-ups, +10-15% BW', notes: 'Momentum assists transition' },
          { level: 'Strict Bar Muscle-Up', benchmark: '12-15 pull-ups, +35-50% BW', notes: 'Chest-to-bar capacity required' },
          { level: 'Strict Ring Muscle-Up', benchmark: '15+ pull-ups, +40-55% BW', notes: 'False grip adds difficulty' },
          { level: 'Weighted Muscle-Up', benchmark: '20+ pull-ups, +60%+ BW', notes: 'Elite pulling strength' },
        ],
      },
      {
        h2: 'High Pull Capacity',
        content: 'Pulling height determines transition ease:',
        list: [
          'Chin-to-bar: Minimum (difficult transition)',
          'Chest-to-bar: Good (manageable transition)',
          'Sternum-to-bar: Excellent (easy transition)',
          'High pulls should be explosive, not grinding',
        ],
      },
      {
        h2: 'Dip Strength Requirements',
        content: 'The catch and press-out require significant dip strength:',
        list: [
          'Basic muscle-up: 15+ strict dips',
          'Ring muscle-up: 10+ ring dips with control',
          'Deep dip ROM: Essential for catching the transition',
          'Russian dips: Excellent transfer to muscle-up catch',
        ],
      },
      {
        h2: 'Explosive Power',
        content: 'Muscle-ups require explosive pulling, not just max strength:',
        list: [
          'Explosive pull-ups: Pull as high as possible',
          'Jumping pull-ups with float: Land in transition position',
          'Clapping pull-ups: Demonstrates power capacity',
          'Power is trained differently than max strength',
        ],
      },
      {
        h2: 'False Grip Strength (Rings)',
        content: 'Ring muscle-ups require false grip endurance:',
        list: [
          'False grip hang: 15-20 seconds minimum',
          'False grip rows: 10+ reps maintaining grip',
          'False grip pull-ups: 5-8 reps with control',
          'Grip often limits ring muscle-up before strength does',
        ],
      },
    ],
    toolSlug: 'muscle-up-progression',
    toolName: 'Muscle-Up Calculator',
    relatedGuides: ['muscle-up-progression', 'weighted-pull-up-standards'],
  },
  'hspu-strength-requirements': {
    title: 'HSPU Strength Requirements',
    metaTitle: 'HSPU Strength Requirements: Pressing Benchmarks | SpartanLab',
    metaDescription: 'Detailed strength requirements for handstand push-ups. Learn the pressing, core, and balance prerequisites for wall and freestanding HSPU.',
    icon: Dumbbell,
    category: 'Strength',
    intro: 'Handstand push-ups combine overhead pressing strength with inverted stability. This guide details the strength benchmarks needed for each HSPU progression.',
    sections: [
      {
        h2: 'Pressing Strength Requirements',
        content: 'Weighted dip and pike push-up strength predict HSPU ability:',
        table: [
          { level: 'Pike Push-Ups', benchmark: 'Bodyweight dips x15+', notes: 'Entry level preparation' },
          { level: 'Wall HSPU (partial)', benchmark: '+15-25% BW dips', notes: 'Half ROM wall HSPU' },
          { level: 'Wall HSPU (full)', benchmark: '+30-40% BW dips', notes: 'Head to floor and back' },
          { level: 'Deficit Wall HSPU', benchmark: '+45-55% BW dips', notes: 'Extended ROM pressing' },
          { level: 'Freestanding HSPU', benchmark: '+50-60% BW dips', notes: 'Plus balance mastery' },
        ],
      },
      {
        h2: 'Pike Push-Up Progressions',
        content: 'Pike push-ups build HSPU-specific pressing strength:',
        list: [
          'Floor pike push-ups: 15-20 reps (basic foundation)',
          'Elevated pike push-ups (knee height): 12-15 reps',
          'High elevated pike push-ups (hip height): 10-12 reps',
          'Wall pike push-ups (feet on wall): 8-10 reps',
        ],
      },
      {
        h2: 'Handstand Hold Requirements',
        content: 'Time inverted builds the stability needed for pressing:',
        list: [
          'Wall handstand (back to wall): 60+ seconds',
          'Wall handstand (chest to wall): 45+ seconds',
          'Freestanding handstand: 10+ seconds for FS-HSPU',
          'Hold capacity should exceed pressing requirements',
        ],
      },
      {
        h2: 'Shoulder Mobility Requirements',
        content: 'Overhead mobility affects HSPU safety and ROM:',
        list: [
          'Full shoulder flexion: Arms straight overhead, touching wall',
          'No excessive arch needed to reach overhead',
          'Thoracic extension capacity for stacking',
          'Limited mobility increases injury risk',
        ],
      },
      {
        h2: 'Core Stability',
        content: 'Core prevents collapse during the press:',
        list: [
          'Hollow body hold: 45-60 seconds',
          'Handstand with hollow position: No banana back',
          'Plank variations: 60+ seconds all directions',
          'Core weakness shows as back arch during press',
        ],
      },
    ],
    toolSlug: 'hspu-progression',
    toolName: 'HSPU Strength Calculator',
    relatedGuides: ['hspu-progression', 'calisthenics-strength-standards'],
  },
  'calisthenics-beginner-program': {
    title: 'Calisthenics Beginner Program Guide',
    metaTitle: 'Calisthenics Beginner Program: Start Your Journey | SpartanLab',
    metaDescription: 'Complete beginner calisthenics program with exercises, sets, reps, and progression guidelines. Build foundational strength for advanced skills.',
    icon: GraduationCap,
    category: 'Programming',
    intro: 'Starting calisthenics with the right foundation accelerates long-term progress. This guide provides a structured beginner program focused on building the strength base needed for advanced skills.',
    sections: [
      {
        h2: 'Beginner Program Overview',
        content: 'Train 3 times per week with at least one rest day between sessions. Focus on movement quality over volume.',
        table: [
          { level: 'Duration', benchmark: '8-12 weeks', notes: 'Before progressing to intermediate' },
          { level: 'Sessions', benchmark: '3x per week', notes: 'Full body each session' },
          { level: 'Session length', benchmark: '45-60 minutes', notes: 'Including warm-up' },
          { level: 'Focus', benchmark: 'Quality over quantity', notes: 'Perfect form first' },
        ],
      },
      {
        h2: 'Beginner Pull Exercises',
        content: 'Build pulling strength progressively:',
        list: [
          'Bodyweight Rows: Start here if 0 pull-ups. 3x8-12',
          'Negative Pull-Ups: 3-5 second lowering. 3x5-8',
          'Band-Assisted Pull-Ups: Progress to thinner bands. 3x6-10',
          'Pull-Ups: Work toward 3x8 before adding weight',
        ],
      },
      {
        h2: 'Beginner Push Exercises',
        content: 'Develop pushing foundation:',
        list: [
          'Push-Ups: Master form first. 3x10-20',
          'Incline Push-Ups: If regular push-ups are too hard',
          'Diamond Push-Ups: After mastering standard. 3x8-12',
          'Dips (assisted if needed): Work toward 3x10',
        ],
      },
      {
        h2: 'Beginner Core Work',
        content: 'Build core stability for future skill work:',
        list: [
          'Hollow Body Hold: Work to 30-45 seconds',
          'Plank Variations: Front, side planks. 30-60 seconds',
          'Dead Bug: 3x10 each side with control',
          'Knee Raises (hanging or lying): 3x10-15',
        ],
      },
      {
        h2: 'Weekly Schedule Example',
        content: 'Sample beginner week structure:',
        list: [
          'Monday: Pull focus (rows, pull-up progression, core)',
          'Wednesday: Push focus (push-ups, dip progression, core)',
          'Friday: Full body (lighter versions of all)',
          'Other days: Rest or light mobility work',
        ],
      },
      {
        h2: 'When to Progress',
        content: 'Move to intermediate programming when you can:',
        list: [
          'Perform 8+ strict pull-ups',
          'Complete 20+ push-ups with good form',
          'Do 10+ strict dips',
          'Hold hollow body for 30+ seconds',
          'Train consistently for 2-3 months',
        ],
      },
    ],
    toolSlug: 'calisthenics-program-builder',
    toolName: 'Program Builder',
    relatedGuides: ['calisthenics-strength-standards', 'calisthenics-intermediate-program'],
  },
  'calisthenics-intermediate-program': {
    title: 'Calisthenics Intermediate Program Guide',
    metaTitle: 'Calisthenics Intermediate Program: Build Skill Foundations | SpartanLab',
    metaDescription: 'Intermediate calisthenics program for athletes with basic strength. Start skill progressions and weighted training.',
    icon: GraduationCap,
    category: 'Programming',
    intro: 'Intermediate programming introduces skill work and weighted training while continuing to build foundational strength. This guide helps you transition from general fitness to targeted skill development.',
    sections: [
      {
        h2: 'Intermediate Program Structure',
        content: 'Train 4 times per week using an upper/lower or push/pull split to increase volume and recovery.',
        table: [
          { level: 'Duration', benchmark: '12-24 weeks', notes: 'Before advanced programming' },
          { level: 'Sessions', benchmark: '4x per week', notes: 'Push/Pull or Upper/Lower' },
          { level: 'Session length', benchmark: '60-75 minutes', notes: 'Including skill work' },
          { level: 'New elements', benchmark: 'Weighted basics + skill intro', notes: 'Build transferable strength' },
        ],
      },
      {
        h2: 'Intermediate Pull Training',
        content: 'Add weight and begin lever progressions:',
        list: [
          'Weighted Pull-Ups: 4x5-8, progress weight when hitting top of range',
          'Tuck Front Lever Holds: 4x10-15 seconds',
          'Front Lever Rows (tuck): 3x5-8',
          'Scapular Pull-Ups: 3x10-12',
        ],
      },
      {
        h2: 'Intermediate Push Training',
        content: 'Develop pressing strength for advanced skills:',
        list: [
          'Weighted Dips: 4x5-8, progressive overload',
          'Pike Push-Ups (elevated): 3x8-12',
          'Planche Leans: 4x20-30 seconds',
          'Ring Push-Ups: 3x8-12 for stability',
        ],
      },
      {
        h2: 'Skill Work Introduction',
        content: 'Begin practicing skills when fresh:',
        list: [
          'Start sessions with 10-15 min skill practice',
          'Choose 1-2 skills to focus on per training block',
          'Front Lever OR Planche focus (not both intensely)',
          'L-Sit progressions for compression strength',
        ],
      },
      {
        h2: 'Sample Intermediate Week',
        content: 'Example 4-day push/pull split:',
        list: [
          'Monday (Pull): FL practice, weighted pull-ups, rows, core',
          'Tuesday (Push): Planche leans, weighted dips, pike push-ups',
          'Thursday (Pull): Muscle-up practice, pull variations, bicep work',
          'Friday (Push): HSPU practice, dip variations, tricep work',
        ],
      },
      {
        h2: 'Intermediate to Advanced Transition',
        content: 'Progress to advanced programming when achieving:',
        list: [
          '+50% BW weighted pull-up (intermediate-advanced boundary)',
          '+40% BW weighted dip',
          'Solid advanced tuck front lever (8-10 seconds)',
          'Tuck planche (5-8 seconds)',
          '15+ second L-sit',
        ],
      },
    ],
    toolSlug: 'calisthenics-program-builder',
    toolName: 'Program Builder',
    relatedGuides: ['calisthenics-beginner-program', 'calisthenics-advanced-program'],
  },
  'calisthenics-advanced-program': {
    title: 'Calisthenics Advanced Program Guide',
    metaTitle: 'Calisthenics Advanced Program: Master Elite Skills | SpartanLab',
    metaDescription: 'Advanced calisthenics programming for skill mastery. Periodization, specialization, and training strategies for elite-level skills.',
    icon: GraduationCap,
    category: 'Programming',
    intro: 'Advanced programming requires strategic periodization and specialization. This guide covers how to structure training for elite skill acquisition while managing the increased demands on recovery.',
    sections: [
      {
        h2: 'Advanced Program Principles',
        content: 'Elite skills require focused blocks and intelligent periodization.',
        table: [
          { level: 'Sessions', benchmark: '4-6x per week', notes: 'Higher frequency, managed intensity' },
          { level: 'Specialization', benchmark: '1-2 priority skills', notes: 'Others in maintenance' },
          { level: 'Periodization', benchmark: 'Block or undulating', notes: 'Structured cycles' },
          { level: 'Recovery', benchmark: 'Critical priority', notes: 'Limits training more than motivation' },
        ],
      },
      {
        h2: 'Skill Prioritization Strategy',
        content: 'You cannot maximally progress all skills simultaneously at the advanced level:',
        list: [
          'Priority skill: 3x per week, progressive overload',
          'Secondary skill: 2x per week, slow progress',
          'Maintenance skills: 1x per week, prevent regression',
          'Rotate priority every 8-12 weeks',
        ],
      },
      {
        h2: 'Advanced Pulling Focus Block',
        content: 'Sample block prioritizing front lever:',
        list: [
          'Front lever work: 4x per week (holds, raises, rows)',
          'Weighted pull-ups: 2-3x per week (strength maintenance)',
          'Muscle-up: 1-2x per week (maintenance)',
          'Planche: 1x per week (light maintenance)',
        ],
      },
      {
        h2: 'Advanced Pushing Focus Block',
        content: 'Sample block prioritizing planche:',
        list: [
          'Planche work: 4x per week (holds, leans, presses)',
          'Weighted dips: 2-3x per week (strength support)',
          'HSPU progression: 1-2x per week (secondary)',
          'Front lever: 1x per week (maintenance)',
        ],
      },
      {
        h2: 'Managing Training Stress',
        content: 'Advanced training requires careful fatigue management:',
        list: [
          'Track RPE daily - adjust based on readiness',
          'Deload every 4-5 weeks (more frequent than intermediate)',
          'Watch for regression as sign of overreaching',
          'Sleep and nutrition become limiting factors',
          'Joint health requires proactive maintenance',
        ],
      },
      {
        h2: 'Sample Advanced Training Week',
        content: 'Example 5-day split with front lever priority:',
        list: [
          'Monday: Heavy FL work, weighted pull-ups',
          'Tuesday: Light planche maintenance, HSPU practice',
          'Wednesday: Active recovery, mobility',
          'Thursday: FL rows and raises, muscle-up technique',
          'Friday: Weighted dips, accessory pushing',
          'Saturday: Light skill practice if recovered',
        ],
      },
    ],
    toolSlug: 'calisthenics-program-builder',
    toolName: 'Adaptive Program Builder',
    relatedGuides: ['calisthenics-intermediate-program', 'calisthenics-periodization'],
  },
}

type Props = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const guide = GUIDES[slug]
  
  if (!guide) {
    return { title: 'Guide Not Found' }
  }
  
  return {
    title: guide.metaTitle,
    description: guide.metaDescription,
    openGraph: {
      title: guide.metaTitle,
      description: guide.metaDescription,
      type: 'article',
    },
  }
}

export function generateStaticParams() {
  return Object.keys(GUIDES).map((slug) => ({ slug }))
}

export default async function GuidePage({ params }: Props) {
  const { slug } = await params
  const guide = GUIDES[slug]
  
  if (!guide) {
    notFound()
  }
  
  const Icon = guide.icon
  
  return (
    <div className="min-h-screen bg-[#0F1115]">
      {/* Sticky Back Navigation */}
      <nav className="px-4 py-3 border-b border-[#2B313A]/50 sticky top-0 z-40 bg-[#0F1115]/95 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link 
            href="/guides"
            className="inline-flex items-center gap-2 text-sm text-[#A4ACB8] hover:text-[#E6E9EF] transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
            <span>All Guides</span>
          </Link>
          <span className="text-xs text-[#6B7280] hidden sm:block">{guide.category}</span>
        </div>
      </nav>
      
      <div className="px-4 py-12 sm:py-16">
      <article className="max-w-3xl mx-auto">
        {/* Breadcrumb - hidden on mobile since we have sticky nav */}
        <nav className="hidden sm:flex items-center gap-2 text-sm text-[#6B7280] mb-8">
          <Link href="/landing" className="hover:text-[#A4ACB8]">Home</Link>
          <span>/</span>
          <Link href="/guides" className="hover:text-[#A4ACB8]">Guides</Link>
          <span>/</span>
          <span className="text-[#A4ACB8]">{guide.title}</span>
        </nav>
        
        {/* Header */}
        <header className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-[#C1121F]/10 flex items-center justify-center">
              <Icon className="w-5 h-5 text-[#C1121F]" />
            </div>
            <span className="text-sm text-[#C1121F] font-medium">{guide.category}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#E6E9EF] mb-6">
            {guide.title}
          </h1>
          <p className="text-lg text-[#A4ACB8] leading-relaxed">
            {guide.intro}
          </p>
        </header>
        
        {/* Tool CTA - Above the fold */}
        <Card className="bg-[#1A1F26] border-[#2B313A] p-6 mb-12">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold text-[#E6E9EF] mb-1">Track Your Progress</h3>
              <p className="text-sm text-[#A4ACB8]">
                Use the free SpartanLab sensor to analyze your current level and get recommendations.
              </p>
            </div>
            <Button asChild className="bg-[#C1121F] hover:bg-[#A30F1A] whitespace-nowrap">
              <Link href={`/tools/${guide.toolSlug}`}>
                Open {guide.toolName.split(' ')[0]} Tool
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        </Card>
        
        {/* Content Sections */}
        <div className="space-y-12">
          {guide.sections.map((section, i) => (
            <section key={i}>
              <h2 className="text-2xl font-bold text-[#E6E9EF] mb-4">
                {section.h2}
              </h2>
              <p className="text-[#A4ACB8] leading-relaxed mb-4">
                {section.content}
              </p>
              
              {/* Table if present */}
              {section.table && (
                <div className="overflow-x-auto mb-4">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#2B313A]">
                        <th className="text-left py-3 pr-4 text-[#E6E9EF] font-semibold">Level</th>
                        <th className="text-left py-3 pr-4 text-[#E6E9EF] font-semibold">Benchmark</th>
                        <th className="text-left py-3 text-[#E6E9EF] font-semibold">Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {section.table.map((row, j) => (
                        <tr key={j} className="border-b border-[#2B313A]/50">
                          <td className="py-3 pr-4 text-[#E6E9EF]">{row.level}</td>
                          <td className="py-3 pr-4 text-[#C1121F] font-medium">{row.benchmark}</td>
                          <td className="py-3 text-[#6B7280]">{row.notes}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              
              {/* List if present */}
              {section.list && (
                <ul className="space-y-2">
                  {section.list.map((item, j) => (
                    <li key={j} className="flex items-start gap-3 text-[#A4ACB8]">
                      <CheckCircle2 className="w-5 h-5 text-[#C1121F] flex-shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
        
        {/* Adaptive Engine CTA */}
        <Card className="mt-16 bg-gradient-to-br from-[#C1121F]/10 via-[#1A1F26] to-[#1A1F26] border-[#C1121F]/20 p-8">
          <div className="text-center">
            <h3 className="text-xl font-bold text-[#E6E9EF] mb-2">
              Want a Personalized Training Plan?
            </h3>
            <p className="text-[#A4ACB8] mb-6 max-w-md mx-auto">
              SpartanLab can automatically generate a training program based on your current levels, 
              goals, and identified limiters.
            </p>
            <Button asChild size="lg" className="bg-[#C1121F] hover:bg-[#A30F1A]">
              <Link href="/dashboard">
                Generate Adaptive Training Plan
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
            <p className="text-xs text-[#6B7280] mt-4">
              Free analysis. Pro unlocks full adaptive programming.
            </p>
          </div>
        </Card>
        
        {/* Related Guides */}
        {guide.relatedGuides.length > 0 && (
          <div className="mt-16">
            <h3 className="text-lg font-semibold text-[#E6E9EF] mb-6">Related Guides</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              {guide.relatedGuides.map((relatedSlug) => {
                const related = GUIDES[relatedSlug]
                if (!related) return null
                const RelatedIcon = related.icon
                return (
                  <Link key={relatedSlug} href={`/guides/${relatedSlug}`}>
                    <Card className="bg-[#1A1F26] border-[#2B313A] p-4 hover:border-[#C1121F]/40 transition-colors group">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[#0F1115] flex items-center justify-center">
                          <RelatedIcon className="w-5 h-5 text-[#C1121F]" />
                        </div>
                        <div>
                          <h4 className="font-medium text-[#E6E9EF] group-hover:text-[#C1121F] transition-colors">
                            {related.title}
                          </h4>
                          <p className="text-xs text-[#6B7280]">{related.category}</p>
                        </div>
                      </div>
                    </Card>
                  </Link>
                )
              })}
            </div>
          </div>
        )}
        
        {/* Back link */}
        <div className="mt-12">
          <Link 
            href="/guides" 
            className="inline-flex items-center gap-2 text-sm text-[#6B7280] hover:text-[#A4ACB8] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            View all guides
          </Link>
        </div>
      </article>
      </div>
    </div>
  )
}
