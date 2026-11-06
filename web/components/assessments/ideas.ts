/** Everyday ideas for parents, shared by the summary route and the roadmap. Wording here goes through clinician review. */

export type IdeaTopic = 'classroom' | 'examinations' | 'executive' | 'sensoryDiet'
export const IDEA_TOPICS: IdeaTopic[] = ['classroom', 'examinations', 'executive', 'sensoryDiet']

export const ADHD_IDEAS: Record<IdeaTopic, string[]> = {
  classroom: [
    'If your child is easily pulled away, try a seat away from doors, windows and busy corners.',
    'A short visual checklist on the desk can make multi-step tasks easier to follow.',
    'A quiet private signal, like a sticky note, can redirect gently without embarrassment.',
  ],
  examinations: [
    'Ask the school whether extra time or a quieter room is possible for tests, if your child finds them hard.',
    'Ask teachers to rephrase long, multi-part questions when needed.',
  ],
  executive: [
    'Break longer tasks into short chunks with a visual timer.',
    'Colour-coded folders or a simple tracker can help with remembering materials.',
  ],
  sensoryDiet: [
    'Short movement breaks between tasks, such as stretching, wall push-ups or a quick errand.',
    'Some children like a quiet fidget, such as a textured strip or a resistance band on the chair.',
  ],
}

export const AUTISM_IDEAS: Record<IdeaTopic, string[]> = {
  classroom: [
    'Now / Next / Later visual schedules before transitions can make the day more predictable.',
    'Clear, direct instructions often help. Try to avoid idioms and sarcasm.',
    'Warn before changes, for example with a visual countdown 5 and 2 minutes before switching activities.',
  ],
  examinations: [
    'Ask whether extra time or a quiet space is possible for tests.',
    'Low-glare, low-echo rooms can help if lights or noise are bothersome.',
  ],
  executive: [
    'Linking new topics to something your child loves can make them easier to start.',
    'Numbered checklists can turn multi-step work into clear steps.',
  ],
  sensoryDiet: [
    'A calm corner with soft light, cushions and headphones can give a place to take a break.',
    'Seamless clothing, sunglasses or ear defenders may help in busy places, if your child finds them bothersome.',
  ],
}

export const DYSLEXIA_IDEAS: Record<IdeaTopic, string[]> = {
  classroom: [
    'Ask the teacher whether your child can sit near the front, where the board and the teacher’s voice are easiest to see and hear.',
    'A clear, uncluttered font with generous spacing and some off-white paper can make printed pages easier on the eyes for some children.',
    'Ask whether instructions can be given aloud as well as written down, and whether spelling mistakes can be marked separately from ideas.',
  ],
  examinations: [
    'Ask the school whether extra time, a reader or a quieter room is possible for tests, if your child finds reading the questions hard.',
    'Ask whether answers can sometimes be given aloud or typed, so that writing speed is not the thing being tested.',
  ],
  executive: [
    'Break homework into short blocks with a visual timer, and read the first instruction together before your child starts.',
    'Colour-coded folders for each subject and a simple checklist can cut down on time spent looking for things.',
  ],
  sensoryDiet: [
    'Reading aloud together for 10 minutes, taking turns by page or paragraph, keeps reading warm rather than a chore.',
    'Audiobooks alongside printed books let your child enjoy stories at their own level while reading skills build.',
  ],
}
