// Everything personal lives in this file.
// To make this site for someone else: change the values below and swap the photos in assets/img/.
// "{name}" inside any text is replaced with `name` automatically.

export const config = {
  name: 'My Love',          // who the birthday is for
  from: 'Perey',            // who made it
  since: '2023',            // shown in the hero corner: "Since 2023"
  birthday: '28 October',

  heroPhoto: 'assets/img/memory-10.jpg',
  storyPhoto: 'assets/img/memory-09.jpg',

  // The big statement. `accent` is the phrase that glows amber.
  statement: {
    before: 'You turn ordinary days into ',
    accent: 'the best parts of my life',
    after: '. Today the whole world gets to celebrate you. I just get to keep doing it tomorrow too.',
  },

  // The moving "I love you" bands. [phrase, language]
  loveWords: [
    ['I love you', 'English'],
    ['Mo nifẹ rẹ', 'Yoruba'],
    ["A hụrụ m gị n'anya", 'Igbo'],
    ['Ina son ki', 'Hausa'],
    ["Je t'aime", 'French'],
    ['Te amo', 'Spanish'],
    ['Nakupenda', 'Swahili'],
    ['Ti amo', 'Italian'],
    ['Ich liebe dich', 'German'],
    ['Eu te amo', 'Portuguese'],
    ['Saranghae', 'Korean'],
    ['Aishiteru', 'Japanese'],
  ],

  // The chapter doors on the home page.
  chapters: [
    { route: 'memories', title: 'Memories', line: 'Every version of you', photo: 'assets/img/memory-12.jpg' },
    { route: 'story', title: 'Our story', line: 'How we got here', photo: 'assets/img/memory-03.jpg' },
    { route: 'notes', title: 'Love notes', line: 'A jar of I love yous', photo: 'assets/img/memory-17.jpg' },
    { route: 'meter', title: 'Love meter', line: 'A game, for two', photo: 'assets/img/memory-05.jpg' },
    { route: 'wish', title: 'Make a wish', line: 'Candles, and you', photo: 'assets/img/memory-16.jpg' },
  ],

  // The photo deck, top card first.
  memories: [
    { src: 'assets/img/memory-01.jpg', caption: 'Where it all began', meta: 'The early years' },
    { src: 'assets/img/memory-02.jpg', caption: 'That smile, already', meta: 'The early years' },
    { src: 'assets/img/memory-07.jpg', caption: 'Partners in crime', meta: 'The early years' },
    { src: 'assets/img/memory-06.jpg', caption: 'School days', meta: 'Uniform era' },
    { src: 'assets/img/memory-05.jpg', caption: 'Game day energy', meta: 'Sports day' },
    { src: 'assets/img/memory-08.jpg', caption: 'Waiting on the world', meta: 'Everyday' },
    { src: 'assets/img/memory-03.jpg', caption: 'Golden hour, green everything', meta: 'Outdoors' },
    { src: 'assets/img/memory-09.jpg', caption: 'Soft light, softer heart', meta: 'Portrait' },
    { src: 'assets/img/memory-10.jpg', caption: 'Teal looks good on you', meta: 'Portrait' },
    { src: 'assets/img/memory-12.jpg', caption: 'Royalty, obviously', meta: 'Portrait' },
    { src: 'assets/img/memory-04.jpg', caption: 'Black and white, still all colour', meta: 'Portrait' },
    { src: 'assets/img/memory-11.jpg', caption: 'Timeless', meta: 'Portrait' },
    { src: 'assets/img/memory-13.jpg', caption: 'That laugh', meta: 'Portrait' },
    { src: 'assets/img/memory-14.jpg', caption: 'Grace, on purpose', meta: 'Portrait' },
    { src: 'assets/img/memory-15.jpg', caption: 'Glowing', meta: 'Portrait' },
    { src: 'assets/img/memory-17.jpg', caption: 'New chapter', meta: 'Everyday' },
    { src: 'assets/img/memory-18.jpg', caption: 'Out here, owning it', meta: 'Everyday' },
    { src: 'assets/img/memory-16.jpg', caption: 'Another year, another cake', meta: 'Birthday' },
  ],

  // Timeline rows. Put your real dates here.
  milestones: [
    { label: 'Milestone', title: 'We met', date: 'March 2023', detail: 'A random hello that changed everything' },
    { label: 'Milestone', title: 'First date', date: 'April 2023', detail: 'I was nervous. You were perfect.' },
    { label: 'Milestone', title: 'Anniversary', date: 'April 2024', detail: 'One year of choosing each other' },
    { label: 'Today', title: 'Your birthday', date: '28 October', detail: 'The best day of the year' },
  ],

  // "The little things" table.
  littleThings: [
    { thing: 'Our song', answer: 'Add your song', note: 'Plays in my head when I miss you' },
    { thing: 'Favourite food', answer: 'Jollof, always', note: 'Never share the last spoon' },
    { thing: 'Dream destination', answer: 'Zanzibar', note: 'One day, together' },
    { thing: 'Comfort movie', answer: 'Add a movie', note: 'Seen it ten times, still cries' },
    { thing: 'Inside joke', answer: 'Our secret', note: 'Nobody else would get it' },
  ],

  // Love notes: one appears each time the envelope is opened.
  notes: [
    "You're the peanut butter to my jelly, the cheese to my pizza.",
    "If kisses were snowflakes, I'd send you a blizzard.",
    "You're cuter than all the puppies in the world combined.",
    "I love you more than chocolate on a Monday.",
    "You stole my heart, but I'll let you keep it.",
    "No matter what, you're always my favourite human.",
    "You + me = forever and ever. With snacks.",
    "You're the sun to my sky, the sparkle to my stars.",
    "You're the milk to my cookies, the icing on my cake.",
    "Without you, my world would be a pencil with no lead. Pointless.",
    "If I could rearrange the alphabet, I'd put U and I together.",
    "You're the reason I wake up smiling.",
    "Like a puzzle, you're the piece that completes me.",
    "You're the melody to my heart, the beat of my soul.",
    "I love you more than coffee, and that's saying a lot.",
    "You're my favourite notification to wake up to.",
    "You're the rainbow after my rain, the calm after my storm.",
    "If I could give you the stars, I'd give you the whole sky.",
    "You're the dream I never want to wake up from.",
    "You're my heart's favourite place to be.",
    "You're the cherry on top of my sundae, the best part of my day.",
    "You're my sunshine on a cloudy day.",
  ],

  // Love meter quiz. Each answer is [text, points] and points go from 0 to 2.
  quiz: [
    { q: 'What would {name} do if you stole the last slice of pizza?', answers: [['Plot revenge while smiling sweetly', 1], ['Let you have it, because love > food', 2], ['Cry in the corner dramatically', 0]] },
    { q: "What's {name}'s secret superpower?", answers: [['Spreading joy with a single smile', 2], ['Turning coffee into complaints', 0], ['Binge-watching at lightning speed', 1]] },
    { q: 'How would {name} react to a surprise tickle attack?', answers: [['Call the tickle police', 0], ['Laugh and plot revenge', 1], ['Tickle back harder, of course', 2]] },
    { q: "What's {name}'s love language?", answers: [['Words of affirmation, with sass', 1], ['Hug attacks and random memes', 2], ['Judging silently from afar', 0]] },
    { q: "What's the most romantic thing {name} would do?", answers: [['Write your name in the sky with a drone', 2], ['Eat your fries and call it love', 0], ['Share the last bite of dessert', 1]] },
    { q: "What's {name}'s ideal lazy Sunday?", answers: [['Rom-coms and cuddles', 1], ['Staying in bed all day giggling', 2], ['Yelling at the neighbours', 0]] },
    { q: 'What does {name} do when missing you?', answers: [['Sends a heart every five minutes', 2], ['Eats ice cream angrily', 0], ['Scrolls old texts and laughs', 1]] },
    { q: "What's {name}'s signature flirting move?", answers: [['Wink and finger guns', 1], ['Mysterious smile and a silly dance', 2], ["Pretends not to care (but does)", 0]] },
  ],

  music: {
    // Optional: drop an mp3 here. If it's missing, the site plays its own code-made music.
    song: 'assets/audio/song.mp3',
  },

  // Where the "Send love" buttons go. A WhatsApp link (https://wa.me/234...) or mailto: works.
  contact: { href: 'mailto:?subject=I%20love%20it' },

  source: 'https://github.com/Codex-Prime01/birthday-website',
};
