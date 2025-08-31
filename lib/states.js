// XState v5 ESM import from CDN (works in vanilla <script type="module">)
import { setup, createMachine, fromCallback } from 'https://esm.sh/xstate@5?bundle';

const DEFAULT_SECONDS = 60;

// helpers
const shuffle = (arr) => {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const drawNextCard = (ctx) => {
  if (ctx.currentCard) return ctx;
  const deck = ctx.roundDeck.slice();
  const next = deck.shift() || null;
  return { ...ctx, currentCard: next, roundDeck: deck };
};

const guessCard = (ctx, points = 3) => {
  if (!ctx.currentCard) return ctx;
  const card = ctx.currentCard;
  const i = ctx.currentTeamIndex;
  const teams = ctx.teams.map((t, idx) => idx === i ? { ...t, score: t.score + points } : t);
  return { ...ctx, teams, currentCard: null, roundWon: [...ctx.roundWon, card] };
};

const skipCard = (ctx) => {
  if (!ctx.currentCard) return ctx;
  const deck = ctx.roundDeck.slice();
  deck.push(ctx.currentCard);
  return { ...ctx, currentCard: null, roundDeck: deck };
};

const applyPenalty = (ctx) => {
  const i = ctx.currentTeamIndex;
  const teams = ctx.teams.map((t, idx) => idx === i ? { ...t, score: Math.max(0, t.score - 1) } : t);
  return { ...ctx, teams };
};

const nextTeamIndex = (ctx) => (ctx.currentTeamIndex + 1) % ctx.teams.length;

// simple timer actor
const timerActor = fromCallback(({ input, sendBack }) => {
  let remaining = input.seconds;
  let isPaused = input.isPaused || false;
  
  sendBack({ type: 'TICK', remaining });
  
  const id = setInterval(() => {
    if (!isPaused) {
      remaining -= 1;
      sendBack({ type: 'TICK', remaining });
      if (remaining <= 0) {
        clearInterval(id);
        sendBack({ type: 'TIME_UP' });
      }
    }
  }, 1000);
  
  return () => clearInterval(id);
});

export const pfnMachine = setup({
  types: {
    context: /** @type {{
      teams: {id:string, name:string, score:number}[],
      allCards: {id:string, word3:string, word1:string}[],
      roundDeck: {id:string, word3:string, word1:string}[],
      roundWon: {id:string, word3:string, word1:string}[],
      currentTeamIndex: number,
      currentCard: {id:string, word3:string, word1:string} | null,
      turnSeconds: number,
      remainingSeconds: number,
      currentPlayerIndex: number,
      playersPerTeam: number
    }} */ ({}),
    events: /** @type {(
      | { type:'ADD_TEAM', id:string, name:string }
      | { type:'REMOVE_TEAM', id:string }
      | { type:'SET_SECONDS', seconds:number }
      | { type:'SET_CARDS', cards:{id:string, word3:string, word1:string}[] }
      | { type:'START_GAME' }
      | { type:'START_TURN' }
      | { type:'GUESS_3' }
      | { type:'GUESS_1' }
      | { type:'SKIP' }
      | { type:'PENALTY' }
      | { type:'TOGGLE_PAUSE' }
      | { type:'NEXT_CARD' }
      | { type:'END_TURN' }
      | { type:'TICK', remaining:number }
      | { type:'TIME_UP' }
      | { type:'RESET' }
    )} */ ({}),
  },
  guards: {
    roundDeckEmpty: ({ context }) =>
      context.roundDeck.length === 0 && context.currentCard == null,
    allPlayersDone: ({ context }) => {
      const totalPlayers = context.teams.length * context.playersPerTeam;
      return context.currentPlayerIndex >= totalPlayers;
    },
  },
  actions: {
    addTeam: ({ context, event }) => {
      const e = event;
      context.teams.push({ id: e.id, name: e.name, score: 0 });
    },
    removeTeam: ({ context, event }) => {
      const e = event;
      const idx = context.teams.findIndex((t) => t.id === e.id);
      if (idx >= 0) context.teams.splice(idx, 1);
    },
    setSeconds: ({ context, event }) => {
      context.turnSeconds = event.seconds;
      context.remainingSeconds = event.seconds;
    },
    setCards: ({ context, event }) => {
      context.allCards = event.cards.slice();
    },
    initRoundDeck: ({ context }) => {
      context.roundDeck = shuffle(context.allCards);
      context.roundWon = [];
      context.currentCard = null;
      context.currentPlayerIndex = 0;
    },
    drawCard: ({ context }) => Object.assign(context, drawNextCard(context)),
    onGuess3: ({ context }) => Object.assign(context, guessCard(context, 3)),
    onGuess1: ({ context }) => Object.assign(context, guessCard(context, 1)),
    onSkip: ({ context }) => Object.assign(context, skipCard(context)),
    onPenalty: ({ context }) => Object.assign(context, applyPenalty(context)),
    togglePause: ({ context }) => { context.isPaused = !context.isPaused; },
    nextPlayer: ({ context }) => { 
      context.currentPlayerIndex += 1;
      // For pass-and-play, simply alternate between teams
      context.currentTeamIndex = (context.currentTeamIndex + 1) % context.teams.length;
    },
    resetTurnTimer: ({ context }) => { context.remainingSeconds = context.turnSeconds; },
    updateRemaining: ({ context, event }) => { context.remainingSeconds = event.remaining; },
    shuffleDeckForNextTurn: ({ context }) => {
      // Shuffle the remaining deck before the next player's turn
      context.roundDeck = shuffle(context.roundDeck);
    },
    resetGame: ({ context }) => {
      context.teams = [];
      context.roundDeck = [];
      context.roundWon = [];
      context.currentTeamIndex = 0;
      context.currentPlayerIndex = 0;
      context.currentCard = null;
      context.remainingSeconds = context.turnSeconds;
      context.playersPerTeam = 2; // Default to 2 players per team
    },
  },
  actors: { turnTimer: timerActor },
}).createMachine({
  id: 'pfn',
  initial: 'lobby',
      context: {
      teams: [],
      allCards: [],
      roundDeck: [],
      roundWon: [],
      currentTeamIndex: 0,
      currentCard: null,
      turnSeconds: DEFAULT_SECONDS,
      remainingSeconds: DEFAULT_SECONDS,
      currentPlayerIndex: 0,
      playersPerTeam: 2,
      isPaused: false,
    },
  states: {
    lobby: {
      on: {
        ADD_TEAM: { actions: 'addTeam' },
        REMOVE_TEAM: { actions: 'removeTeam' },
        SET_SECONDS: { actions: 'setSeconds' },
        SET_CARDS: { actions: 'setCards' },
        START_GAME: {
            // Jump directly into the first turn for pass-and-play
            target: 'turn.prepare',
            actions: ['initRoundDeck', 'resetTurnTimer'],
            guard: ({ context }) =>
            context.teams.length >= 2 && context.allCards.length > 0,
        },
      },
    },
    turn: {
      initial: 'prepare',
      states: {
        prepare: {
          entry: ['shuffleDeckForNextTurn', 'drawCard', 'resetTurnTimer'],
          always: { target: 'playing' },
        },
        
        playing: {
          invoke: { 
            src: 'turnTimer', 
            input: ({ context }) => ({ 
              seconds: context.remainingSeconds,
              isPaused: context.isPaused 
            }) 
          },
          on: {
            TICK: { actions: 'updateRemaining' },
            TIME_UP: { target: 'turnEnd' },
            NEXT_CARD: { actions: 'drawCard' },
            GUESS_3: [{ actions: ['onGuess3', 'drawCard'] }],
            GUESS_1: [{ actions: ['onGuess1', 'drawCard'] }],
            SKIP: { actions: ['onSkip', 'drawCard'] },
            PENALTY: { actions: 'onPenalty' },
            TOGGLE_PAUSE: { 
              actions: 'togglePause',
              // Restart the timer actor to pick up the new pause state
              target: 'playing'
            },
            END_TURN: { target: 'turnEnd' },
          },
          always: { guard: 'roundDeckEmpty', target: 'turnEnd' },
        },
        
        // when a turn ends, check if all players have gone
        turnEnd: {
          entry: ['nextPlayer'],
          always: [
            { guard: 'allPlayersDone', target: '#pfn.betweenRounds' },
            { target: 'handoff' }
          ],
        },
        
        // handoff waits for the next player to tap "Start Turn"
        handoff: {
          entry: ['shuffleDeckForNextTurn'],
          on: {
            START_TURN: { target: 'prepare' },
          },
        },
      },
    },
    betweenRounds: {
      id: 'betweenRounds',
      on: { 
        START_TURN: { target: 'turn.prepare', actions: ['initRoundDeck', 'resetTurnTimer'] },
        RESET: { target: 'lobby', actions: 'resetGame' }
      },
    },
    gameOver: {
      id: 'gameOver',
      on: { RESET: { target: 'lobby', actions: 'resetGame' } },
    },
  },
});
