// English transcripts of the pre-recorded teacher clips in /public/sounds. When a non-English language is chosen,
// the client script answers requests for these mp3 files with synthesized speech of the translated transcript.
export const CLIP_TRANSCRIPTS: Record<string, string> = {
  teacher_full: "Good morning class. Please listen carefully for tomorrow's 3 assignments: First, read Chapter 4, pages 30 to 35 in your textbook. Second, answer questions 2 and 5 in your blue notebook. Third, bring your project outline for Friday's lab.",
  teacher_c1: 'First, read Chapter 4, pages 30 to 35 in your textbook.',
  teacher_c2: 'Second, answer questions 2 and 5 in your blue notebook.',
  teacher_c3: "Third, bring your project outline for Friday's lab.",
}
