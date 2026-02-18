export interface SeedQuestion {
  text: string
  correct_answer: string
  category:
    | 'science'
    | 'history'
    | 'geography'
    | 'math'
    | 'nature'
    | 'language'
    | 'pop_culture'
  difficulty: number
}

export const seedQuestions: SeedQuestion[] = [
  // ── science (8) ──────────────────────────────────────────────
  {
    text: 'What is the speed of light in a vacuum?',
    correct_answer: 'Approximately 299,792 kilometers per second',
    category: 'science',
    difficulty: 1,
  },
  {
    text: 'Why does the Moon appear to change shape throughout the month?',
    correct_answer:
      'Because we see different portions of its sunlit side as it orbits Earth',
    category: 'science',
    difficulty: 1,
  },
  {
    text: 'What causes thunder during a storm?',
    correct_answer:
      'The rapid expansion of air heated by a lightning bolt creates a shockwave',
    category: 'science',
    difficulty: 2,
  },
  {
    text: 'What is the hardest natural substance on Earth?',
    correct_answer: 'Diamond',
    category: 'science',
    difficulty: 1,
  },
  {
    text: 'Why do helium balloons float?',
    correct_answer: 'Helium is less dense than the surrounding air',
    category: 'science',
    difficulty: 1,
  },
  {
    text: 'What happens to water molecules when water freezes?',
    correct_answer:
      'They form a crystalline lattice structure that takes up more space than liquid water',
    category: 'science',
    difficulty: 2,
  },
  {
    text: 'Why is the sky blue?',
    correct_answer:
      'Shorter blue wavelengths of sunlight are scattered more by the atmosphere (Rayleigh scattering)',
    category: 'science',
    difficulty: 2,
  },
  {
    text: 'What is the primary function of mitochondria in a cell?',
    correct_answer:
      'To produce ATP (energy) through cellular respiration',
    category: 'science',
    difficulty: 2,
  },

  // ── history (8) ──────────────────────────────────────────────
  {
    text: 'Why was the Great Wall of China built?',
    correct_answer:
      'To protect Chinese states and empires from raids and invasions by northern nomadic groups',
    category: 'history',
    difficulty: 1,
  },
  {
    text: 'What caused the sinking of the Titanic?',
    correct_answer: 'It struck an iceberg in the North Atlantic Ocean',
    category: 'history',
    difficulty: 1,
  },
  {
    text: 'Who was the first person to walk on the Moon?',
    correct_answer: 'Neil Armstrong, on July 20, 1969',
    category: 'history',
    difficulty: 1,
  },
  {
    text: 'Why did the Roman Empire fall?',
    correct_answer:
      'A combination of military overextension, economic troubles, government corruption, and barbarian invasions',
    category: 'history',
    difficulty: 3,
  },
  {
    text: 'What was the purpose of the Rosetta Stone?',
    correct_answer:
      'It was a decree inscribed in three scripts, and it allowed scholars to decipher Egyptian hieroglyphs',
    category: 'history',
    difficulty: 2,
  },
  {
    text: 'Why did ancient Egyptians build pyramids?',
    correct_answer:
      'As monumental tombs for pharaohs, to protect their bodies and possessions for the afterlife',
    category: 'history',
    difficulty: 1,
  },
  {
    text: 'What sparked the French Revolution?',
    correct_answer:
      'Widespread social inequality, financial crisis, food shortages, and Enlightenment ideas about liberty',
    category: 'history',
    difficulty: 2,
  },
  {
    text: 'How did the Great Fire of London start in 1666?',
    correct_answer:
      'In a bakery on Pudding Lane owned by Thomas Farriner',
    category: 'history',
    difficulty: 2,
  },

  // ── geography (7) ────────────────────────────────────────────
  {
    text: 'Why is the Dead Sea called "dead"?',
    correct_answer:
      'Its extreme salinity (roughly 10 times saltier than the ocean) prevents most organisms from living in it',
    category: 'geography',
    difficulty: 1,
  },
  {
    text: 'What makes Old Faithful in Yellowstone erupt on a schedule?',
    correct_answer:
      'A narrow constriction in its underground plumbing causes superheated water to build pressure and erupt at semi-regular intervals',
    category: 'geography',
    difficulty: 3,
  },
  {
    text: 'Why is Australia both a country and a continent?',
    correct_answer:
      'It is the only landmass large enough to be classified as a continent that is governed as a single nation',
    category: 'geography',
    difficulty: 1,
  },
  {
    text: 'What is the longest river in the world?',
    correct_answer: 'The Nile River, at approximately 6,650 kilometers',
    category: 'geography',
    difficulty: 1,
  },
  {
    text: 'Why does Iceland have hot springs despite being so far north?',
    correct_answer:
      'It sits on the Mid-Atlantic Ridge with significant volcanic and geothermal activity',
    category: 'geography',
    difficulty: 2,
  },
  {
    text: 'What country has the most time zones?',
    correct_answer: 'France, with 12 time zones (due to overseas territories)',
    category: 'geography',
    difficulty: 3,
  },
  {
    text: 'Why is the Sahara Desert so dry?',
    correct_answer:
      'Subtropical high-pressure systems cause dry air to descend, preventing cloud formation and rainfall',
    category: 'geography',
    difficulty: 2,
  },

  // ── math (7) ─────────────────────────────────────────────────
  {
    text: 'Why is dividing by zero undefined?',
    correct_answer:
      'Because no number multiplied by zero gives a nonzero result, making the operation logically contradictory',
    category: 'math',
    difficulty: 2,
  },
  {
    text: 'What is the value of pi, and why does it matter?',
    correct_answer:
      'Pi is approximately 3.14159; it is the ratio of a circle circumference to its diameter and appears throughout mathematics and physics',
    category: 'math',
    difficulty: 1,
  },
  {
    text: 'Why is a Mobius strip special in mathematics?',
    correct_answer:
      'It is a surface with only one side and one edge, formed by twisting a strip of paper and joining the ends',
    category: 'math',
    difficulty: 2,
  },
  {
    text: 'What is the next number in the Fibonacci sequence after 0, 1, 1, 2, 3, 5, 8?',
    correct_answer: '13 (each number is the sum of the two preceding ones)',
    category: 'math',
    difficulty: 1,
  },
  {
    text: 'What does "infinity" actually mean in mathematics?',
    correct_answer:
      'It is a concept representing something without any bound or limit, not an actual number',
    category: 'math',
    difficulty: 2,
  },
  {
    text: 'Why is the number zero important?',
    correct_answer:
      'It serves as the additive identity, a placeholder in positional notation, and enables the concept of nothingness in math',
    category: 'math',
    difficulty: 1,
  },
  {
    text: 'How many sides does a dodecahedron have?',
    correct_answer: '12 pentagonal faces',
    category: 'math',
    difficulty: 2,
  },

  // ── nature (7) ───────────────────────────────────────────────
  {
    text: 'Why do cats purr?',
    correct_answer:
      'Through rapid movement of the laryngeal muscles; purposes include self-soothing, communication, and promoting healing',
    category: 'nature',
    difficulty: 1,
  },
  {
    text: 'How do salmon find their way back to the river where they were born?',
    correct_answer:
      'Primarily through their sense of smell, detecting unique chemical signatures of their home stream',
    category: 'nature',
    difficulty: 2,
  },
  {
    text: 'Why do flamingos stand on one leg?',
    correct_answer:
      'It is thought to reduce heat loss and muscular effort, as the position is passively stable',
    category: 'nature',
    difficulty: 1,
  },
  {
    text: 'What is the largest living organism on Earth?',
    correct_answer:
      'A honey fungus (Armillaria ostoyae) in Oregon, spanning about 2,385 acres',
    category: 'nature',
    difficulty: 3,
  },
  {
    text: 'Why do sloths move so slowly?',
    correct_answer:
      'Their diet of leaves provides very little energy, so slow movement conserves calories and helps them avoid predators through camouflage',
    category: 'nature',
    difficulty: 1,
  },
  {
    text: 'How does an octopus change color?',
    correct_answer:
      'By expanding and contracting specialized pigment cells called chromatophores in their skin',
    category: 'nature',
    difficulty: 2,
  },
  {
    text: 'Why do wolves howl?',
    correct_answer:
      'To communicate with pack members over long distances, coordinate hunts, and mark territory',
    category: 'nature',
    difficulty: 1,
  },

  // ── language (7) ─────────────────────────────────────────────
  {
    text: 'Why does English have so many irregular verbs?',
    correct_answer:
      'They are remnants of older Germanic strong verb conjugation patterns that survived the shift to a simpler system',
    category: 'language',
    difficulty: 2,
  },
  {
    text: 'What is the most spoken language in the world by number of native speakers?',
    correct_answer: 'Mandarin Chinese',
    category: 'language',
    difficulty: 1,
  },
  {
    text: 'Why do some languages read right to left?',
    correct_answer:
      'It evolved from early writing systems (such as those of Semitic languages) where the direction was likely influenced by the writing medium and hand dominance',
    category: 'language',
    difficulty: 2,
  },
  {
    text: 'What is an onomatopoeia?',
    correct_answer:
      'A word that phonetically imitates the sound it describes, like "buzz" or "splash"',
    category: 'language',
    difficulty: 1,
  },
  {
    text: 'Why does the letter "W" have the name "double-u" instead of "double-v"?',
    correct_answer:
      'In Old English, the letter was written as "uu" (two u shapes), and the name stuck even after the letterform changed',
    category: 'language',
    difficulty: 2,
  },
  {
    text: 'What is the shortest complete sentence in English?',
    correct_answer: '"I am." or simply "Go." (a single-word imperative)',
    category: 'language',
    difficulty: 1,
  },
  {
    text: 'Why do we say "goodbye"?',
    correct_answer:
      'It is a contraction of "God be with ye," an old English parting blessing',
    category: 'language',
    difficulty: 2,
  },

  // ── pop_culture (6) ──────────────────────────────────────────
  {
    text: 'Why did the chicken cross the road?',
    correct_answer: 'To get to the other side',
    category: 'pop_culture',
    difficulty: 1,
  },
  {
    text: 'What was the first feature-length animated film ever released?',
    correct_answer:
      'El Apostol (1917), though the earliest surviving one is Snow White and the Seven Dwarfs (1937)',
    category: 'pop_culture',
    difficulty: 2,
  },
  {
    text: 'Why is the Mona Lisa considered the most famous painting in the world?',
    correct_answer:
      'A combination of Leonardo da Vinci mastery, the enigmatic expression, and massive publicity after its theft from the Louvre in 1911',
    category: 'pop_culture',
    difficulty: 2,
  },
  {
    text: 'What instrument does a DJ actually play?',
    correct_answer:
      'Turntables (or digital equivalents), mixers, and controllers used to blend and manipulate recorded music',
    category: 'pop_culture',
    difficulty: 1,
  },
  {
    text: 'Why do we throw rice at weddings?',
    correct_answer:
      'It is an ancient tradition symbolizing fertility, prosperity, and good fortune for the newlyweds',
    category: 'pop_culture',
    difficulty: 1,
  },
  {
    text: 'What was the first video game ever made?',
    correct_answer:
      'Tennis for Two (1958) or, depending on definition, Spacewar! (1962)',
    category: 'pop_culture',
    difficulty: 2,
  },
]
