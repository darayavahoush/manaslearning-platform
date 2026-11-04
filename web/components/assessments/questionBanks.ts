import type { QuizItem } from './QuizRunner'

export type QuestId = 'dyslexia' | 'adhd' | 'autism'
export type Level = 'young' | 'older'

let n = 0
/** First answer in `right` + `wrong` is the correct one; ids stay with the text when shuffled. */
function mc(section: string, prompt: string, right: string, wrong: string[], extra: Partial<QuizItem> = {}): QuizItem {
  const ids = ['a', 'b', 'c', 'd']
  return {
    id: `${section.replace(/\W+/g, '-').toLowerCase()}-${++n}`,
    section,
    prompt,
    choices: [right, ...wrong].map((text, i) => ({ id: ids[i], text })),
    correctId: 'a',
    ...extra,
  }
}

const spell = (word: string, wrong: string[], section = 'Spell it') =>
  mc(section, 'Listen to the word, then pick the right spelling.', word, wrong, { speak: word, autoPlay: true })

function dyslexiaYoung(): QuizItem[] {
  const S1 = 'Real word hunt', S2 = 'Finish the sentence', S4 = 'Story time'
  const story = 'Mina has a red kite. The wind is strong today. She runs to the park and lets the kite go up, up, up. It flies over the trees.'
  return [
    mc(S1, 'Which one is a real word?', 'sun', ['sut', 'snu']),
    mc(S1, 'Which one is a real word?', 'milk', ['mulk', 'mikl']),
    mc(S1, 'Which one is a real word?', 'fish', ['fosh', 'fush']),
    mc(S1, 'Which one is a real word?', 'tree', ['treg', 'trea']),
    mc(S1, 'Which one is a real word?', 'bird', ['birt', 'brid']),
    mc(S2, 'The cat sat on the ___.', 'mat', ['run', 'blue']),
    mc(S2, 'I drink ___ from a cup.', 'water', ['chair', 'jump']),
    mc(S2, 'A bird can ___ in the sky.', 'fly', ['hop', 'dig']),
    mc(S2, 'We use a pen to ___.', 'write', ['swim', 'sleep']),
    spell('boat', ['bote', 'bowt']),
    spell('jump', ['jamp', 'jumpp']),
    spell('green', ['grene', 'gren']),
    mc(S4, "What colour is Mina's kite?", 'red', ['blue', 'green'], { passage: story }),
    mc(S4, 'Where does Mina run?', 'to the park', ['to the school', 'to the shop'], { passage: story }),
    mc(S4, 'What does the kite fly over?', 'the trees', ['the sea', 'the house'], { passage: story }),
  ]
}

function dyslexiaOlder(): QuizItem[] {
  const S1 = 'Right spelling', S2 = 'Finish the sentence', S4 = 'Story time'
  const story = 'Ravi found an old map in the attic. It showed a path through the forest to a hidden spring. Ravi packed water, a torch and a sandwich. After an hour of walking, the trees opened and he heard water trickling over the stones.'
  return [
    mc(S1, 'Which one is spelled right?', 'friend', ['freind', 'frend']),
    mc(S1, 'Which one is spelled right?', 'because', ['becuase', 'becase']),
    mc(S1, 'Which one is spelled right?', 'believe', ['beleive', 'belive']),
    mc(S1, 'Which one is spelled right?', 'knife', ['nife', 'knyfe']),
    mc(S1, 'Which one is spelled right?', 'different', ['diffrent', 'diferent']),
    mc(S2, 'We went ___ the shop to buy bread.', 'to', ['too', 'two']),
    mc(S2, 'The dog wagged ___ tail.', 'its', ["it's", "its'"]),
    mc(S2, 'Please put the books over ___.', 'there', ['their', "they're"]),
    mc(S2, 'She was ___ tired to keep her eyes open.', 'too', ['to', 'two']),
    mc(S2, 'Would you like ___ ice cream?', 'some', ['sum', 'same']),
    spell('necessary', ['neccessary', 'necesary']),
    spell('beautiful', ['beutiful', 'beautifull']),
    spell('separate', ['seperate', 'separete']),
    mc(S4, 'Where did Ravi find the map?', 'in the attic', ['by the river', 'in a book'], { passage: story }),
    mc(S4, 'What did the map show?', 'a path to a hidden spring', ['the way to school', 'a treasure chest'], { passage: story }),
    mc(S4, 'What did Ravi hear at the end?', 'water trickling', ['a bell ringing', 'a dog barking'], { passage: story }),
    mc(S4, 'Why did Ravi pack water, a torch and a sandwich?', 'He was getting ready for a long walk', ['He was going to a party', 'He wanted to sell them'], { passage: story }),
  ]
}

export const SCALE = [
  { id: '0', text: 'Not like me', emoji: '🌱' },
  { id: '1', text: 'A little like me', emoji: '🌿' },
  { id: '2', text: 'Mostly like me', emoji: '🌳' },
  { id: '3', text: 'Very like me', emoji: '🌟' },
]

const about = (section: string, statements: string[]): QuizItem[] =>
  statements.map((s, i) => ({
    id: `${section}-${i + 1}`,
    section,
    prompt: s,
    choices: SCALE,
    fixedOrder: true,
  }))

function adhdAbout(): QuizItem[] {
  return about('About me: focus and energy', [
    'Stories and games can hold my attention for a long time.',
    'Sounds or things I see around me pull my attention away.',
    'I forget what I was just about to do.',
    'I feel full of energy and want to move.',
    'It is hard for me to wait for my turn.',
    'I like starting new things more than finishing them.',
    'Getting started on homework is hard for me.',
    'I lose my things a lot.',
  ])
}

function autismAbout(): QuizItem[] {
  return about('About me: comfort and friends', [
    'Loud sounds bother me.',
    'Bright lights bother me.',
    'I like to know what is going to happen next.',
    'It is hard for me when plans suddenly change.',
    'I enjoy playing with other kids.',
    'It is easy for me to tell how someone is feeling.',
    'I have a favourite topic I could talk about for hours.',
    'Some clothes or foods feel too scratchy or too strong.',
  ])
}

export function bankFor(quest: QuestId, level: Level): QuizItem[] {
  n = 0
  if (quest === 'dyslexia') return level === 'young' ? dyslexiaYoung() : dyslexiaOlder()
  return quest === 'adhd' ? adhdAbout() : autismAbout()
}

/** Shuffle answer order per session (not for rating scales). */
export function prepare(items: QuizItem[]): QuizItem[] {
  return items.map((it) => {
    if (it.fixedOrder) return it
    const c = it.choices.slice()
    for (let i = c.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[c[i], c[j]] = [c[j], c[i]]
    }
    return { ...it, choices: c }
  })
}

export const CONFIG: Record<QuestId, { title: string; kicker: string; emoji: string; accent: string; intro: string; levels: boolean }> = {
  dyslexia: {
    title: 'The Whispering Library: Reading Questions',
    kicker: 'Reading & spelling',
    emoji: '🦉',
    accent: '#9DC3AE',
    intro: 'Pip the owl will show one question at a time. Read it, tap your answer, then tap Next. You can press “Read to me” any time, and skip any question you like.',
    levels: true,
  },
  adhd: {
    title: 'Sky Citadel: About Me',
    kicker: 'Focus & energy',
    emoji: '🐦',
    accent: '#E3C58A',
    intro: 'These are not right-or-wrong questions. Read each one and tap how much it sounds like you. A grown-up can sit with you and read them out.',
    levels: false,
  },
  autism: {
    title: 'Whispering Groves: About Me',
    kicker: 'Comfort & friends',
    emoji: '🌿',
    accent: '#A8D0C3',
    intro: 'These are not right-or-wrong questions. Read each one and tap how much it sounds like you. A grown-up can sit with you and read them out.',
    levels: false,
  },
}
