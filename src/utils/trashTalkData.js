/**
 * Collection of generic trash talk phrases for use when LLM is unavailable
 */
const genericTrashTalk = [
  "bot:Your pieces are scattered like leaves in the wind. My strategy is impenetrable!",
  "bot:Is that all you've got? My grandma plays better chess, and she doesn't even know the rules!",
  "bot:Another predictable move. I'm already five steps ahead of you.",
  "bot:Your position is so weak, even a beginner could spot the flaws.",
  "bot:I'm just warming up! Wait until you see what's coming next.",
  "bot:Your defense has more holes than Swiss cheese.",
  "bot:Are you sure you want to continue? I can offer a merciful resignation.But the lazy developer hasn't added resign feature yet",
  "bot:Your strategy reminds me of a blindfolded player... uncertain and misguided.",
  "bot:I'm setting traps you haven't even noticed yet. This will be over soon.",
  "bot:That move? Seriously? It's like you're deliberately helping me win.",
  "bot:Your king is getting lonely over there. Don't worry, my pieces will visit soon.",
  "bot:I learned chess yesterday and already I'm outplaying you!",
  "bot:My pieces are dancing circles around yours. Care to join the rhythm?",
  "bot:The board is my canvas, and your defeat is my masterpiece.",
  "bot:You play like you're reading a chess book... from the wrong end!",
  "bot:Check the rules again - I don't think the pieces are supposed to move like that.",
  "bot:Each of your moves makes my victory more inevitable.",
//   "Is your strategy based on hope? Because that's not working out well.",
//   "Maybe you should stick to checkers? Just a friendly suggestion!",
//   "I'm not playing chess, I'm conducting a symphony of destruction against your pieces.",
//   "Your position is collapsing faster than a house of cards in a hurricane.",
//   "This isn't even my final form! Wait until the endgame.",
//   "I've seen more coordinated pieces in a beginner's first game.",
//   "Your pieces lack teamwork. Mine are functioning like a well-oiled machine!",
//   "I'm giving you a chess lesson for free. You're welcome!",
//   "Your moves are so bad, even the pawns are laughing at you.",
//   "I'm playing chess, you're playing checkers. The difference is clear.",
//   "Sorry you can't find resign button .The lazy developer hasn't added resign feature yet",
];

/**
 * Returns a random trash talk phrase from the collection
 * @returns {string} A random trash talk phrase
 */
export const getRandomTrashTalk = () => {
  const randomIndex = Math.floor(Math.random() * genericTrashTalk.length);
  return genericTrashTalk[randomIndex];
};

export default genericTrashTalk;
