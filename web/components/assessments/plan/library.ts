/**
 * Wording for the 4-week home plan. Every line here is a DRAFT until a clinician has reviewed it.
 *
 * Rules for anything added to this file:
 * - Everyday things a parent can try or notice. Never a finding about the child, never a diagnosis or a label.
 * - No claim that an activity treats or improves a condition. They are ways to make a day smoother and to notice more.
 * - Nothing here reads a game result against a threshold. The plan is shaped by what the parent says about their child.
 * - One idea per line, in plain language.
 */
export const PLAN_REVIEWED = false

export type GoalId = 'start' | 'settle' | 'change' | 'feelings' | 'friends' | 'senses' | 'sleep' | 'mornings'
export type Option = {id: string; label: string}
export type Question = {id: string; title: string; hint?: string; kind: 'single' | 'multi'; max?: number; options: Option[]}

export const GOALS: Array<Option & {id: GoalId}> = [
  {id: 'start', label: 'Starting and finishing tasks'},
  {id: 'settle', label: 'Staying settled when sitting'},
  {id: 'change', label: 'Changes and switching activities'},
  {id: 'feelings', label: 'Big feelings'},
  {id: 'friends', label: 'Playing with other children'},
  {id: 'senses', label: 'Sounds, lights and textures'},
  {id: 'sleep', label: 'Bedtime and sleep routine'},
  {id: 'mornings', label: 'School mornings'},
]

export const QUESTIONS: Question[] = [
  {id: 'goals', title: 'What would you most like some help with?', hint: 'Pick up to 3.', kind: 'multi', max: 3, options: GOALS},
  {id: 'hardest', title: 'When is the day hardest?', kind: 'single', options: [
    {id: 'morning', label: 'Morning'}, {id: 'afterschool', label: 'After school'}, {id: 'homework', label: 'Homework time'},
    {id: 'evening', label: 'Evening'}, {id: 'bedtime', label: 'Bedtime'}, {id: 'outings', label: 'Outings and crowded places'},
  ]},
  {id: 'loves', title: 'What does your child love doing?', hint: 'Pick all that fit. We use these to make activities feel like play.', kind: 'multi', options: [
    {id: 'drawing', label: 'Drawing and colouring'}, {id: 'building', label: 'Building (blocks, Lego)'}, {id: 'music', label: 'Music and dance'},
    {id: 'animals', label: 'Animals'}, {id: 'vehicles', label: 'Cars, trains and vehicles'}, {id: 'stories', label: 'Stories and books'},
    {id: 'games', label: 'Screens and video games'}, {id: 'outdoors', label: 'Running and outdoor play'}, {id: 'cooking', label: 'Cooking and helping at home'},
  ]},
  {id: 'movement', title: 'How is it for your child to sit still for a while?', kind: 'single', options: [
    {id: 'lots', label: 'Needs to move a lot'}, {id: 'some', label: 'Needs some movement breaks'}, {id: 'happy', label: 'Happy to sit'},
  ]},
  {id: 'learn', title: 'How does your child follow instructions best?', kind: 'single', options: [
    {id: 'visual', label: 'With pictures or a written list'}, {id: 'spoken', label: 'Short spoken words'}, {id: 'show', label: 'When shown first'}, {id: 'steps', label: 'One step at a time'},
  ]},
  {id: 'change', title: 'How does your child react when plans change?', kind: 'single', options: [
    {id: 'easy', label: 'Usually copes easily'}, {id: 'warning', label: 'Needs a warning first'}, {id: 'hard', label: 'Finds it very hard'},
  ]},
  {id: 'senses', title: 'Is your child bothered by any of these?', hint: 'Pick all that fit.', kind: 'multi', options: [
    {id: 'sound', label: 'Loud or sudden sounds'}, {id: 'light', label: 'Bright lights'}, {id: 'touch', label: 'Clothes, tags or textures'},
    {id: 'crowds', label: 'Crowds'}, {id: 'seeks', label: 'Seeks pressure or movement (squeezing, spinning, crashing)'}, {id: 'none', label: 'None of these'},
  ]},
  {id: 'calm', title: 'What helps your child calm down?', hint: 'Pick all that fit.', kind: 'multi', options: [
    {id: 'hug', label: 'A hug or being close'}, {id: 'space', label: 'Space and quiet'}, {id: 'move', label: 'Moving or running'},
    {id: 'music', label: 'Music'}, {id: 'object', label: 'A favourite toy or object'}, {id: 'talk', label: 'Talking it through'},
  ]},
  {id: 'minutes', title: 'How much time can you give each day?', kind: 'single', options: [
    {id: '10', label: 'About 10 minutes'}, {id: '20', label: 'About 20 minutes'}, {id: '30', label: 'About 30 minutes'},
  ]},
  {id: 'helpers', title: 'Who can help at home?', kind: 'single', options: [
    {id: 'me', label: 'Just me'}, {id: 'two', label: 'Two adults'}, {id: 'family', label: 'Adults and brothers or sisters'},
  ]},
]

/** What a child loves, as a short phrase that fits into a sentence. */
export const LOVE_PHRASE: Record<string, string> = {
  drawing: 'drawing', building: 'building', music: 'music', animals: 'animals', vehicles: 'cars and trains',
  stories: 'stories', games: 'a favourite game', outdoors: 'outdoor play', cooking: 'cooking',
}

export const CALM_PHRASE: Record<string, string> = {
  hug: 'a hug', space: 'quiet space', move: 'a way to move', music: 'calm music', object: 'a favourite toy', talk: 'a short chat',
}

export const HARDEST_PHRASE: Record<string, string> = {
  morning: 'mornings', afterschool: 'after school', homework: 'homework time', evening: 'evenings', bedtime: 'bedtime', outings: 'outings',
}

export const HOW_TO_GIVE: Record<string, string> = {
  visual: 'Show the steps as a picture or a short written list, and let your child tick them off.',
  spoken: 'Use one short sentence, say it once, and wait a few seconds before repeating.',
  show: 'Do the first step together, then let your child do the next.',
  steps: 'Give one step at a time, and give the next one only when the first is done.',
}

export type Activity = {id: string; goal: GoalId; minutes: number; text: string; moves?: boolean; needs?: 'two' | 'family'}

/** {love} becomes a phrase for something the child loves, or "something your child loves". */
export const ACTIVITIES: Activity[] = [
  // starting and finishing tasks
  {id: 'start-1', goal: 'start', minutes: 10, text: 'Pick one small task and break it into 3 steps. Draw or write the steps, and tick each one. Add a bit of {love} when all three are done.'},
  {id: 'start-2', goal: 'start', minutes: 5, text: 'Use a visual timer for a short 5-minute "start" burst. Stop when it ends, even if your child wants to go on, so starting feels easy.'},
  {id: 'start-3', goal: 'start', minutes: 10, moves: true, text: 'Do a "first, then" card: first the task for a few minutes, then a short turn at {love}. Keep the "then" small and the same every day.'},
  {id: 'start-4', goal: 'start', minutes: 15, text: 'Let your child choose the order of two jobs. A little choice often makes starting less of a fight.'},
  // staying settled when sitting
  {id: 'settle-1', goal: 'settle', minutes: 5, moves: true, text: 'Before seated work, do a 2-minute movement break: wall push-ups, jumping jacks or carrying something heavy across the room.'},
  {id: 'settle-2', goal: 'settle', minutes: 10, text: 'Try seated work in short blocks of 5 to 8 minutes, with a break to stand or stretch between blocks. Slowly lengthen the blocks over the week.'},
  {id: 'settle-3', goal: 'settle', minutes: 10, text: 'Offer a quiet fidget (a textured strip or a band on the chair legs) during listening time, and notice whether it helps your child listen.'},
  {id: 'settle-4', goal: 'settle', minutes: 10, text: 'Make a little "work spot" away from doors and screens, with only what is needed for today\u2019s task on the desk.'},
  // changes and switching activities
  {id: 'change-1', goal: 'change', minutes: 5, text: 'Give a warning before switching: a visual countdown at 5 minutes and again at 2 minutes. Keep the same words every time.'},
  {id: 'change-2', goal: 'change', minutes: 10, text: 'Make a Now / Next / Later board with pictures for after-school time. Let your child move the pictures as each part is done.'},
  {id: 'change-3', goal: 'change', minutes: 10, text: 'Practise one small, safe change on purpose (a different route or a different cup) and praise how your child handled it. Keep it low-stakes.'},
  {id: 'change-4', goal: 'change', minutes: 5, text: 'Give a "transition object" to carry from one activity to the next, such as a toy from {love}, so something stays the same during the switch.'},
  // big feelings
  {id: 'feelings-1', goal: 'feelings', minutes: 10, text: 'Make a feelings chart with 4 faces (happy, sad, cross, worried). Ask your child to point to one at set times, and name it back to them.'},
  {id: 'feelings-2', goal: 'feelings', minutes: 10, text: 'Make a calm kit in a box with what helps your child settle ({calm}), plus something to do with {love}. Practise using it when your child is calm.'},
  {id: 'feelings-3', goal: 'feelings', minutes: 5, moves: true, text: 'Practise slow breathing as a game: smell the flower, blow out the candle. Do it when things are calm so it is familiar when things are hard.'},
  {id: 'feelings-4', goal: 'feelings', minutes: 10, text: 'Use a story or a favourite character to talk about a feeling: "How do you think they felt?" Keep it light and stop if your child loses interest.'},
  // playing with other children
  {id: 'friends-1', goal: 'friends', minutes: 15, text: 'Set up a short, structured play date (30 to 45 minutes) around {love}, with one friend and a clear start and end.', needs: 'two'},
  {id: 'friends-2', goal: 'friends', minutes: 10, text: 'Take turns in a simple game with you, and say "my turn" and "your turn" out loud. Keep rounds short and finish while your child is still enjoying it.'},
  {id: 'friends-3', goal: 'friends', minutes: 10, text: 'Practise one short phrase for joining play, such as "Can I play too?", with toys or puppets first, then in real play.'},
  {id: 'friends-4', goal: 'friends', minutes: 15, text: 'Play a cooperative game where everyone wins together, like building one big structure with siblings or friends.', needs: 'family'},
  // sounds, lights and textures
  {id: 'senses-1', goal: 'senses', minutes: 10, text: 'Make a quiet, low-light corner with cushions and headphones that your child can go to any time, without needing to ask.'},
  {id: 'senses-2', goal: 'senses', minutes: 5, text: 'Before a noisy or bright place, tell your child what it will be like and agree on a signal for "I need a break". Keep an exit plan.'},
  {id: 'senses-3', goal: 'senses', minutes: 10, text: 'Let your child choose clothes from a few that feel comfortable. Cut out tags and check seams.'},
  {id: 'senses-4', goal: 'senses', minutes: 10, moves: true, text: 'Add a "heavy work" game: carrying books, pushing a laundry basket or squeezing a pillow, a few minutes before a hard time of day.'},
  // bedtime and sleep
  {id: 'sleep-1', goal: 'sleep', minutes: 15, text: 'Build a short wind-down routine in the same order every night (wash, pyjamas, story, lights out) and show it as pictures.'},
  {id: 'sleep-2', goal: 'sleep', minutes: 10, text: 'Switch off screens at least an hour before bed, and swap in something calm, like drawing or a story about {love}.'},
  {id: 'sleep-3', goal: 'sleep', minutes: 10, text: 'Keep the bedroom dim, cool and quiet at bedtime. Keep the same bedtime and wake time as far as you can, including weekends.'},
  // school mornings
  {id: 'mornings-1', goal: 'mornings', minutes: 10, text: 'Pack the bag and lay out clothes the night before, with your child, using a picture checklist.'},
  {id: 'mornings-2', goal: 'mornings', minutes: 10, text: 'Make a morning picture routine on the wall (wake, wash, dress, eat, shoes). Let your child tick each step.'},
  {id: 'mornings-3', goal: 'mornings', minutes: 5, text: 'Build in a few spare minutes so there is no rush, and give a gentle 10-minute and 5-minute warning before leaving.'},
]

export const WEEK_THEMES = [
  {id: 'week1', title: 'Week 1: Notice and set up', blurb: 'No pressure to change anything yet. Watch, note and make the home a little easier.'},
  {id: 'week2', title: 'Week 2: Try one thing', blurb: 'One goal, a few small activities. Pick one a day.'},
  {id: 'week3', title: 'Week 3: Keep going and add one', blurb: 'Keep what helped. Add a second goal if there is room.'},
  {id: 'week4', title: 'Week 4: Look back and talk', blurb: 'See what stayed the same, what changed, and what to ask a professional.'},
]

export const PLAN_TEXT = {
  notice: 'Keep a short diary. Each evening write one line: what was hard, what helped, and where it happened (home, school, with friends).',
  anchor: 'Find 2 or 3 things your child loves and use them as the "then" part of a routine (first this, then {love}).',
  review: 'Read your diary from the four weeks. Circle what helped and what you noticed in more than one place.',
  replay: 'If you like, play the games again on another day on the same device, in a quiet room, and compare what stays the same. Small differences between two short sessions are expected.',
  bring: 'Take your diary, the report and your questions to your child\u2019s paediatrician, psychologist or school and ask what they notice too.',
  worried: 'If anything worries you (for example your child seems very distressed, loses skills they had, or cannot be comforted), speak to a doctor soon rather than waiting for the end of this plan.',
  notDiagnosis: 'This plan is a set of everyday ideas, shaped by what you told us. It is not a treatment and does not say what is wrong or right with your child.',
  sleepNote: 'If sleep is a worry, talk to your child\u2019s doctor as well.',
}
