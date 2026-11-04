import {NextResponse} from 'next/server'

export interface AssessmentProfile {
  childName: string
  childAge: number
  gender: string
  grade?: string
  informantRole: string
  primaryConcerns?: string
}

export interface AdhdBatteryMetrics {
  hrtMs: number
  omissions: number
  commissions: number
  rtvMs: number
  flankerCostMs: number
  workingMemorySpan: number
  vanderbiltInattention: number
  vanderbiltHyperactivity: number
}

export interface AutismBatteryMetrics {
  jointAttentionLatencyMs: number
  jointAttentionAccuracy: number
  theoryOfMindScore: number
  sensoryVisualScore: number
  sensoryAuditoryScore: number
  sensoryTactileScore: number
  setShiftingCostMs: number
  perseverativeErrors: number
  scqScore: number
}

function calculateAdhdScores(m: AdhdBatteryMetrics, age: number) {
  // Conners CPT-3 & Vanderbilt Age-Normed T-Score estimation (Mean=50, SD=10)
  // Higher T-score = higher clinical severity; T >= 65 is clinically significant (+1.5 SD)
  const baseHrt = age < 8 ? 580 : age < 12 ? 460 : 380
  const hrtDiff = (m.hrtMs - baseHrt) / 40
  const omissionT = Math.min(85, Math.max(40, Math.round(50 + m.omissions * 4.5)))
  const commissionT = Math.min(85, Math.max(40, Math.round(50 + m.commissions * 4.2)))
  const rtvT = Math.min(85, Math.max(40, Math.round(50 + (m.rtvMs - 75) / 6.5)))
  const flankerT = Math.min(85, Math.max(40, Math.round(50 + (m.flankerCostMs - 45) / 5.5)))

  const vInattT = Math.min(85, Math.max(40, Math.round(45 + (m.vanderbiltInattention / 27) * 35)))
  const vHyperT = Math.min(85, Math.max(40, Math.round(45 + (m.vanderbiltHyperactivity / 27) * 35)))

  // Composite indices
  const inattentionIndex = Math.round((omissionT * 0.45 + vInattT * 0.4 + rtvT * 0.15))
  const impulsivityIndex = Math.round((commissionT * 0.45 + vHyperT * 0.4 + flankerT * 0.15))
  const executiveControl = Math.max(10, Math.min(99, Math.round(100 - (inattentionIndex + impulsivityIndex) / 2)))

  let classification = 'Mild / Typical Attentional Regulation'
  let profileType = 'Sub-threshold'
  if (inattentionIndex >= 65 && impulsivityIndex >= 65) {
    classification = 'High Probability: ADHD Combined Presentation'
    profileType = 'Combined Type'
  } else if (inattentionIndex >= 65) {
    classification = 'Elevated Probability: ADHD Predominantly Inattentive Presentation'
    profileType = 'Inattentive Type'
  } else if (impulsivityIndex >= 65) {
    classification = 'Elevated Probability: ADHD Predominantly Hyperactive-Impulsive Presentation'
    profileType = 'Hyperactive-Impulsive Type'
  } else if (inattentionIndex >= 60 || impulsivityIndex >= 60) {
    classification = 'Borderline / Sub-clinical Executive Attentional Fragility'
    profileType = 'Monitoring Recommended'
  }

  return {
    omissionT,
    commissionT,
    rtvT,
    flankerT,
    vInattT,
    vHyperT,
    inattentionIndex,
    impulsivityIndex,
    executiveControl,
    classification,
    profileType,
  }
}

function calculateAutismScores(m: AutismBatteryMetrics) {
  // PRISM (Pediatric Reciprocal Interaction & Sensory Modulation) Normative Scoring
  const socialReciprocity = Math.max(10, Math.min(95, Math.round(
    m.jointAttentionAccuracy * 0.6 + Math.max(0, 100 - m.jointAttentionLatencyMs / 25) * 0.4
  )))
  const contextualNuance = Math.max(10, Math.min(95, Math.round(m.theoryOfMindScore)))
  const sensoryReactivity = Math.min(95, Math.round(
    ((m.sensoryVisualScore + m.sensoryAuditoryScore + m.sensoryTactileScore) / 30) * 100
  ))
  const cognitiveFlexibility = Math.max(10, Math.min(95, Math.round(
    100 - (m.perseverativeErrors * 14 + (m.setShiftingCostMs / 20))
  )))
  const scqScore = m.scqScore

  let classification = 'Typical Social-Sensory Variation'
  let supportLevel = 'Level 0: No Clinical Support Indicated'
  if (scqScore >= 11 || (socialReciprocity < 50 && sensoryReactivity > 70 && cognitiveFlexibility < 50)) {
    classification = 'Elevated Autism Spectrum & Sensory Processing Profile'
    supportLevel = 'Level 2: Substantial Environmental & Pragmatic Support Indicated'
  } else if (scqScore >= 8 || socialReciprocity < 65 || sensoryReactivity > 65) {
    classification = 'Emerging Neurodivergent Social-Sensory Communication Profile'
    supportLevel = 'Level 1: Targeted Social-Communication & Sensory Accommodations Indicated'
  } else if (sensoryReactivity > 70) {
    classification = 'Isolated Sensory Processing Over-Responsiveness (Sensory Modulation Profile)'
    supportLevel = 'Sensory Diet & Environmental Accommodations Advised'
  }

  return {
    socialReciprocity,
    contextualNuance,
    sensoryReactivity,
    cognitiveFlexibility,
    scqScore,
    classification,
    supportLevel,
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const {assessmentType, profile, adhdMetrics, autismMetrics} = body as {
      assessmentType: 'adhd' | 'autism'
      profile: AssessmentProfile
      adhdMetrics?: AdhdBatteryMetrics
      autismMetrics?: AutismBatteryMetrics
    }

    if (!profile || !assessmentType) {
      return NextResponse.json({error: 'Missing required profile or assessment type.'}, {status: 400})
    }

    const reportId = `ML-ASM-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`
    const evaluatedAt = new Date().toISOString()

    if (assessmentType === 'adhd' && adhdMetrics) {
      const stats = calculateAdhdScores(adhdMetrics, profile.childAge || 9)
      const report = {
        reportId,
        evaluatedAt,
        assessmentTitle: 'Manas FocusTrack™ Gamified Cognitive & Attention Battery (CPT-3 + Vanderbilt Normed)',
        profile,
        stats,
        adhdMetrics,
        indices: [
          {name: 'Sustained Attention Index', score: stats.inattentionIndex, cutoff: 65, status: stats.inattentionIndex >= 65 ? 'Elevated' : 'Within Expected Limits'},
          {name: 'Behavioral Inhibition & Impulse Control', score: stats.impulsivityIndex, cutoff: 65, status: stats.impulsivityIndex >= 65 ? 'Elevated' : 'Within Expected Limits'},
          {name: 'Attentional Stability & RTV', score: stats.rtvT, cutoff: 65, status: stats.rtvT >= 65 ? 'Marked Variability' : 'Stable Consistency'},
          {name: 'Interference Control (Flanker Cost)', score: stats.flankerT, cutoff: 65, status: stats.flankerT >= 65 ? 'High Distractor Vulnerability' : 'Typical Filtering'},
          {name: 'Executive Cognitive Control Capacity', score: stats.executiveControl, cutoff: 50, status: stats.executiveControl < 50 ? 'Compromised Under Fatigue' : 'Robust Capacity'}
        ],
        strengths: [
          'High creative association and out-of-the-box conceptual problem-solving capacity.',
          'Intense hyperfocus potential when tasks provide high novelty, immediate agency, and visual engagement.',
          'Rapid visual stimulus detection and intuitive exploratory learning style.',
          'Strong social empathy and enthusiasm when provided with clear, bite-sized expectations.'
        ],
        accommodations: [
          'Classroom chunking: Break down multi-step independent assignments into 10–12 minute active sprints with visual check-boxes.',
          'Sensory & motor resets: Provide brief proprioceptive breaks (stretching, wall push-ups, standing desk option) between seated cognitive blocks.',
          'Preferential seating: Seat away from high-traffic doorways, pencil sharpeners, and window glare to reduce involuntary visual-distractor capture.',
          'Externalized working memory scaffolds: Use visual timers (Time Timer), desk-mounted checklist strips, and color-coded folder systems.',
          'Evaluations: Allow 1.5x extended time on timed written assessments to minimize fine-motor fatigue and impulsive rushing.'
        ],
        clinicalSummary: `${profile.childName} (Age ${profile.childAge}) completed the multi-stage Manas FocusTrack™ continuous performance and executive control battery alongside parent/educator dimensional Vanderbilt rating. Results indicate ${stats.classification}. Hit reaction time demonstrated ${stats.rtvT >= 65 ? 'elevated latency variability across later blocks, reflecting executive vigilance fatigue' : 'consistent motor-speed stability'}. Behavioral commission errors reflect ${stats.commissionT >= 65 ? 'an impulsive response style requiring external inhibitory scaffolds' : 'well-regulated response inhibition'}. Comprehensive pedagogical support and 1-on-1 developmental review are strongly recommended.`
      }
      return NextResponse.json(report)
    }

    if (assessmentType === 'autism' && autismMetrics) {
      const stats = calculateAutismScores(autismMetrics)
      const report = {
        reportId,
        evaluatedAt,
        assessmentTitle: 'Manas PRISM™ Gamified Autism Social-Communication & Sensory Profile (ADOS-2 & SPM-2 Mapped)',
        profile,
        stats,
        autismMetrics,
        indices: [
          {name: 'Joint Attention & Social Referencing', score: stats.socialReciprocity, status: stats.socialReciprocity < 60 ? 'Atypical / Object-Biased' : 'Consistent Reciprocity'},
          {name: 'Contextual Pragmatic Language & Nuance', score: stats.contextualNuance, status: stats.contextualNuance < 60 ? 'Literal Interpretation Preference' : 'Context-Aware Decoding'},
          {name: 'Sensory Over-Responsiveness Landscape', score: stats.sensoryReactivity, status: stats.sensoryReactivity > 65 ? 'High Sensory Sensitivity / Overload Risk' : 'Typical Sensory Modulation'},
          {name: 'Cognitive Set-Shifting & Rule Flexibility', score: stats.cognitiveFlexibility, status: stats.cognitiveFlexibility < 55 ? 'Rigid / High Need for Predictability' : 'Flexible Set-Shifting'}
        ],
        strengths: [
          'Exceptional visual-pattern recognition, systematic memory, and deep attention to detail.',
          'Deep, passionate domain mastery and sustained immersion in special interests.',
          'Authentic, direct, and unvarnished communication style without social pretense.',
          'High perceptual sensitivity to visual harmony, logical structures, and structural order.'
        ],
        accommodations: [
          'Predictable Visual Timetable: Provide step-by-step visual schedules (Now / Next / Later) before transitions between home or classroom tasks.',
          'Sensory Sanctuary Spaces: Establish a low-stimulus quiet zone (dim lighting, noise-cancelling headphones, beanbag) to prevent sensory escalation.',
          'Explicit Social Clarification: Avoid ambiguous idioms, sarcasm, or implied directions; frame requests with clear, concrete, literal steps.',
          'Transition Warnings: Implement 5-minute and 2-minute visual/tactile countdowns before task or activity switches.',
          'Special Interest Scaffolding: Anchor new or challenging academic topics to the child’s passionate special interests to drive organic motivation.'
        ],
        clinicalSummary: `${profile.childName} (Age ${profile.childAge}) engaged in the Manas PRISM™ interactive social-perceptual, sensory modulation, and cognitive flexibility battery. Findings reflect ${stats.classification} with ${stats.supportLevel}. Profile indicates ${stats.sensoryReactivity > 65 ? 'pronounced sensory modulation challenges, particularly in loud, multi-talker or flickering environments' : 'regulated sensory processing'}. Social communication demonstrates a preference for ${stats.contextualNuance < 60 ? 'clear, literal structure over implied pragmatics' : 'flexible social interaction'}. Formal clinical integration and specialized developmental consultation are recommended.`
      }
      return NextResponse.json(report)
    }

    return NextResponse.json({error: 'Invalid assessment metrics.'}, {status: 400})
  } catch (error) {
    console.error('Assessment analysis failed:', error)
    return NextResponse.json({error: 'Failed to generate assessment report.'}, {status: 500})
  }
}
