// ── All clinical screening instruments ──

export interface ScreeningQuestion {
  id: number;
  text: string;
}

export interface ScreeningOption {
  label: string;
  value: number;
}

// ─── PHQ-9 (Patient Health Questionnaire) ───
export const PHQ9_QUESTIONS: ScreeningQuestion[] = [
  { id: 1, text: 'Little interest or pleasure in doing things' },
  { id: 2, text: 'Feeling down, depressed, or hopeless' },
  { id: 3, text: 'Trouble falling or staying asleep, or sleeping too much' },
  { id: 4, text: 'Feeling tired or having little energy' },
  { id: 5, text: 'Poor appetite or overeating' },
  { id: 6, text: 'Feeling bad about yourself — or that you are a failure or have let yourself or your family down' },
  { id: 7, text: 'Trouble concentrating on things, such as reading or watching TV' },
  { id: 8, text: 'Moving or speaking so slowly that other people could have noticed? Or the opposite — being so fidgety or restless' },
  { id: 9, text: 'Thoughts that you would be better off dead, or of hurting yourself in some way' },
];

export const PHQ9_OPTIONS: ScreeningOption[] = [
  { label: 'Not at all', value: 0 },
  { label: 'Several days', value: 1 },
  { label: 'More than half the days', value: 2 },
  { label: 'Nearly every day', value: 3 },
];

export const PHQ9_INSTRUCTION = 'Over the last 2 weeks, how often have you been bothered by any of the following?';

// ─── GAD-7 (Generalized Anxiety Disorder) ───
export const GAD7_QUESTIONS: ScreeningQuestion[] = [
  { id: 1, text: 'Feeling nervous, anxious, or on edge' },
  { id: 2, text: 'Not being able to stop or control worrying' },
  { id: 3, text: 'Worrying too much about different things' },
  { id: 4, text: 'Trouble relaxing' },
  { id: 5, text: 'Being so restless that it\'s hard to sit still' },
  { id: 6, text: 'Becoming easily annoyed or irritable' },
  { id: 7, text: 'Feeling afraid, as if something awful might happen' },
];

export const GAD7_OPTIONS: ScreeningOption[] = [
  { label: 'Not at all', value: 0 },
  { label: 'Several days', value: 1 },
  { label: 'More than half the days', value: 2 },
  { label: 'Nearly every day', value: 3 },
];

export const GAD7_INSTRUCTION = 'Over the last 2 weeks, how often have you been bothered by the following?';

// ─── PQ-16 (Prodromal Questionnaire) ───
export const PQ16_QUESTIONS: ScreeningQuestion[] = [
  { id: 1, text: 'I feel uninterested in the things I used to enjoy' },
  { id: 2, text: 'I often seem to live through events exactly as they happened before (déjà vu)' },
  { id: 3, text: 'I sometimes smell or taste things that other people can\'t smell or taste' },
  { id: 4, text: 'I often hear unusual sounds like banging, clicking, hissing, clapping or ringing in my ears' },
  { id: 5, text: 'I have had the experience of doing something and wondering why I did it' },
  { id: 6, text: 'I sometimes see special meanings in advertisements, shop windows, or in the way things are arranged around me' },
  { id: 7, text: 'I have felt that there are messages for me in the way things are arranged around me' },
  { id: 8, text: 'I have had the experience of hearing faint or clear sounds of people or a person mumbling or talking when there is no one near me' },
  { id: 9, text: 'I have had the experience of hearing what other people are thinking' },
  { id: 10, text: 'I have had the experience of my thoughts being taken away from me' },
  { id: 11, text: 'I have had experiences with telepathy, psychic forces, or fortune telling' },
  { id: 12, text: 'I have believed that I was being sent special messages through the TV or radio' },
  { id: 13, text: 'I have felt that I am not in control of my own ideas or thoughts' },
  { id: 14, text: 'I have felt that my experiences are so strange that other people would find them very hard to believe' },
  { id: 15, text: 'I sometimes feel suddenly distracted by distant sounds that I am not normally aware of' },
  { id: 16, text: 'I have had the experience that my body or a part of my body feels strange or different from usual' },
];

export const PQ16_OPTIONS: ScreeningOption[] = [
  { label: 'No', value: 0 },
  { label: 'Yes', value: 1 },
];

export const PQ16_INSTRUCTION = 'Please indicate whether you have experienced any of the following:';

// ─── WSAS (Work and Social Adjustment Scale) ───
export const WSAS_QUESTIONS: ScreeningQuestion[] = [
  { id: 1, text: 'My ability to work or study' },
  { id: 2, text: 'My home management (cleaning, shopping, cooking, looking after home/children)' },
  { id: 3, text: 'My social leisure activities (with other people)' },
  { id: 4, text: 'My private leisure activities (done alone)' },
  { id: 5, text: 'My ability to form and maintain close relationships' },
];

export const WSAS_OPTIONS: ScreeningOption[] = [
  { label: '0 - Not at all', value: 0 },
  { label: '1', value: 1 },
  { label: '2 - Slightly', value: 2 },
  { label: '3', value: 3 },
  { label: '4 - Definitely', value: 4 },
  { label: '5', value: 5 },
  { label: '6 - Markedly', value: 6 },
  { label: '7', value: 7 },
  { label: '8 - Very severely', value: 8 },
];

export const WSAS_INSTRUCTION = 'How much do your current difficulties affect the following areas of your life?';

// ─── ReQoL-10 (Recovering Quality of Life) ───
export const REQOL10_QUESTIONS: ScreeningQuestion[] = [
  { id: 1, text: 'I could do the things I wanted to do' },
  { id: 2, text: 'I felt able to trust others' },
  { id: 3, text: 'I felt unable to cope' },          // reverse scored
  { id: 4, text: 'I felt happy' },
  { id: 5, text: 'I felt lonely' },                   // reverse scored
  { id: 6, text: 'I felt confident in myself' },
  { id: 7, text: 'I felt hopeless' },                 // reverse scored
  { id: 8, text: 'I enjoyed what I did' },
  { id: 9, text: 'I felt close to other people' },
  { id: 10, text: 'I felt I could think clearly' },
];

// Items that need reverse scoring (negatively worded)
export const REQOL10_REVERSE_ITEMS = [3, 5, 7];

export const REQOL10_OPTIONS: ScreeningOption[] = [
  { label: 'None of the time', value: 0 },
  { label: 'Only occasionally', value: 1 },
  { label: 'Sometimes', value: 2 },
  { label: 'Often', value: 3 },
  { label: 'Most or all of the time', value: 4 },
];

export const REQOL10_INSTRUCTION = 'For each of the following, select the option that best describes your experiences over the last week:';

// ─── Screening order ───
export const SCREENING_ORDER = ['phq9', 'gad7', 'pq16', 'wsas', 'reqol10'] as const;
export type ScreeningType = typeof SCREENING_ORDER[number];

// ─── Thinking Traps for Reframe Tool ───
export const THINKING_TRAPS = [
  { id: 'catastrophizing', label: 'Catastrophizing', description: 'Imagining the worst possible outcome' },
  { id: 'black_white', label: 'Black & White Thinking', description: 'Seeing things as all good or all bad' },
  { id: 'mind_reading', label: 'Mind Reading', description: 'Assuming you know what others are thinking' },
  { id: 'fortune_telling', label: 'Fortune Telling', description: 'Predicting the future negatively' },
  { id: 'personalization', label: 'Personalization', description: 'Blaming yourself for things outside your control' },
  { id: 'should_statements', label: 'Should Statements', description: 'Using "should" or "must" to pressure yourself' },
  { id: 'emotional_reasoning', label: 'Emotional Reasoning', description: 'Believing something is true because you feel it' },
  { id: 'labeling', label: 'Labeling', description: 'Putting a fixed label on yourself or others' },
  { id: 'magnification', label: 'Magnification', description: 'Making problems seem bigger than they are' },
  { id: 'filtering', label: 'Mental Filtering', description: 'Focusing only on the negative details' },
];

// ─── Emotions for Emotion Mapping ───
export const EMOTIONS = [
  { id: 'happy', label: '😊 Happy', color: '#FFD93D' },
  { id: 'sad', label: '😢 Sad', color: '#6C9BCF' },
  { id: 'anxious', label: '😰 Anxious', color: '#FF8C42' },
  { id: 'angry', label: '😠 Angry', color: '#FF6B6B' },
  { id: 'fearful', label: '😨 Fearful', color: '#C084FC' },
  { id: 'disgusted', label: '🤢 Disgusted', color: '#86EFAC' },
  { id: 'surprised', label: '😲 Surprised', color: '#FDE68A' },
  { id: 'calm', label: '😌 Calm', color: '#67E8F9' },
  { id: 'confused', label: '😕 Confused', color: '#D8B4FE' },
  { id: 'numb', label: '😶 Numb', color: '#94A3B8' },
];

// ─── Body Regions for Emotion Mapping ───
export const BODY_REGIONS = [
  'Head', 'Forehead', 'Eyes', 'Jaw', 'Throat',
  'Chest', 'Heart', 'Stomach', 'Shoulders',
  'Arms', 'Hands', 'Back', 'Legs', 'Feet',
];

// ─── MicroGoals ───
export const MICRO_GOALS = [
  { id: 'water', label: 'Drink a glass of water', points: 5, category: 'health' },
  { id: 'walk', label: 'Take a 5-minute walk', points: 10, category: 'movement' },
  { id: 'breathe', label: 'Do 3 deep breaths', points: 5, category: 'mindfulness' },
  { id: 'stretch', label: 'Stretch for 2 minutes', points: 8, category: 'movement' },
  { id: 'tidy', label: 'Tidy one small area', points: 8, category: 'routine' },
  { id: 'message', label: 'Send a kind message to someone', points: 10, category: 'social' },
  { id: 'snack', label: 'Eat a healthy snack', points: 5, category: 'health' },
  { id: 'music', label: 'Listen to a song you love', points: 5, category: 'joy' },
  { id: 'journal', label: 'Write one sentence about your day', points: 10, category: 'mindfulness' },
  { id: 'sleep', label: 'Set a bedtime reminder', points: 5, category: 'health' },
  { id: 'nature', label: 'Look out a window for 1 minute', points: 5, category: 'mindfulness' },
  { id: 'gratitude', label: 'Name one thing you\'re grateful for', points: 8, category: 'mindfulness' },
];

// Small goals for severe/high WSAS users
export const SMALL_GOALS = [
  { id: 'sit', label: 'Sit up in bed', points: 5, category: 'movement' },
  { id: 'face', label: 'Wash your face', points: 5, category: 'health' },
  { id: 'window', label: 'Open a window or curtain', points: 5, category: 'routine' },
  { id: 'sip', label: 'Take a sip of water', points: 3, category: 'health' },
  { id: 'notice', label: 'Notice 3 things you can see', points: 5, category: 'mindfulness' },
  { id: 'hands', label: 'Wash your hands slowly', points: 3, category: 'mindfulness' },
];

// ─── Guided Questions for Reframe Tool ───
export const REFRAME_GUIDED_QUESTIONS = [
  'What evidence supports this thought?',
  'What evidence contradicts this thought?',
  'What would you tell a friend in this situation?',
  'Is there another way to look at this?',
  'Will this matter in 5 years?',
];
