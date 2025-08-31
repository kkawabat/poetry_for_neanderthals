// src/main.js
import { createActor } from 'https://esm.sh/xstate@5?bundle';
import { pfnMachine } from './lib/states.js';

// Load card data
let pfnCards = sampleCards; // Initialize with sample cards as fallback

// Sample Poetry for Neanderthals cards
const sampleCards = [
  { id: "1", word1: "Quiz", word3: "Pop Quiz" },
  { id: "2", word1: "Side", word3: "Bedside" },
  { id: "3", word1: "Love", word3: "Love Letter" },
  { id: "4", word1: "Mind", word3: "Mind Reader" },
  { id: "5", word1: "Tongue", word3: "Tongue-Tied" },
  { id: "6", word1: "Skin", word3: "Snake Skin" },
  { id: "7", word1: "Hair", word3: "Bad Hair Day" },
  { id: "8", word1: "Split", word3: "Split Ends" },
  { id: "9", word1: "Talk", word3: "Talk Radio" },
  { id: "10", word1: "Ghost", word3: "Ghost Town" },
  { id: "11", word1: "Fence", word3: "Electric Fence" },
  { id: "12", word1: "Window", word3: "Window Shopping" },
  { id: "13", word1: "Taco", word3: "Taco Salad" },
  { id: "14", word1: "Wedding", word3: "Wedding Ring" },
  { id: "15", word1: "Tape", word3: "Tape Recorder" },
  { id: "16", word1: "Fall", word3: "Trust Fall" },
  { id: "17", word1: "Wife", word3: "Trophy Wife" },
  { id: "18", word1: "Toilet", word3: "Toilet Paper" },
  { id: "19", word1: "Sun", word3: "Sunburn" },
  { id: "20", word1: "Golf", word3: "Mini Golf" }
];

// Load the JSON file
async function loadCardData() {
  try {
    const response = await fetch('./data/pfn_cards.json');
    const rawCards = await response.json();
    // Transform the card data to match the expected format
    pfnCards = rawCards.map((card, index) => ({
      id: (index + 1).toString(),
      word3: card.hard,
      word1: card.easy
    }));
  } catch (error) {
    console.error('Failed to load card data:', error);
    // Fallback to sample cards
    pfnCards = sampleCards;
  }
}

// Utility functions for working with card data
function getAllCards() {
  return pfnCards;
}



function getRandomCards(count = 20) {
  const shuffled = [...pfnCards].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

// ------- DOM helpers -------
const $ = (sel) => document.querySelector(sel);

// ------- UI refs -------
const ui = {
  // lobby
  viewLobby: $('#viewLobby'),
  team1Name: $('#team1Name'),
  team2Name: $('#team2Name'),
  secondsInput: $('#secondsInput'),
  deckSizeInput: $('#deckSizeInput'),
  startGameBtn: $('#startGameBtn'),

  // turn
  viewTurn: $('#viewTurn'),
  team1NameDisplay: $('#team1NameDisplay'),
  team2NameDisplay: $('#team2NameDisplay'),
  team1Score: $('#team1Score'),
  team2Score: $('#team2Score'),
  team1Card: $('#team1Card'),
  team2Card: $('#team2Card'),
  timer: $('#timer'),
  deckCount: $('#deckCount'),
  currentCard: $('#currentCard'),
  currentCardSubtitle: $('#currentCardSubtitle'),
  scoreBtn: $('#scoreBtn'),
  skipBtn: $('#skipBtn'),
  penaltyBtn: $('#penaltyBtn'),
  pauseBtn: $('#pauseBtn'),

  // handoff
  viewHandoff: $('#viewHandoff'),
  handoffTeam: $('#handoffTeam'),
  handoffDeckCount: $('#handoffDeckCount'),
  handoffStartBtn: $('#handoffStartBtn'),
  endGameBtn: $('#endGameBtn'),



  // game over
  viewGameOver: $('#viewGameOver'),
  finalScores: $('#finalScores'),
  resetBtn: $('#resetBtn'),
};

// ------- State machine -------
const actor = createActor(pfnMachine);

// ------- Event handlers -------
// Check if all required UI elements exist
const requiredElements = [
  'startGameBtn', 'scoreBtn', 'skipBtn', 'penaltyBtn', 'pauseBtn',
  'handoffStartBtn', 'endGameBtn', 'resetBtn'
];

const missingElements = requiredElements.filter(id => !ui[id]);
if (missingElements.length > 0) {
  console.error('Missing UI elements:', missingElements);
  return;
}

ui.startGameBtn.addEventListener('click', () => {
  const team1Name = ui.team1Name.value.trim() || 'Team 1';
  const team2Name = ui.team2Name.value.trim() || 'Team 2';
  const seconds = parseInt(ui.secondsInput.value) || 60;
  const deckSize = parseInt(ui.deckSizeInput.value) || 20;

  console.log('Starting game with:', { team1Name, team2Name, seconds, deckSize });

  // Add teams
  actor.send({ type: 'ADD_TEAM', id: 'team1', name: team1Name });
  actor.send({ type: 'ADD_TEAM', id: 'team2', name: team2Name });

  // Set game settings
  actor.send({ type: 'SET_SECONDS', seconds });

  // Set cards
  const cards = getAllCards().slice(0, deckSize);
  console.log('Setting cards:', cards.length, 'cards');
  
  if (cards.length === 0) {
    console.error('No cards available to start the game');
    return;
  }
  
  actor.send({ type: 'SET_CARDS', cards });

  // Start game
  console.log('Sending START_GAME event');
  actor.send({ type: 'START_GAME' });
});

ui.scoreBtn.addEventListener('click', () => {
  actor.send({ type: 'GUESS_1' });
});

ui.skipBtn.addEventListener('click', () => {
  actor.send({ type: 'SKIP' });
});

ui.penaltyBtn.addEventListener('click', () => {
  actor.send({ type: 'PENALTY' });
});

ui.pauseBtn.addEventListener('click', () => {
  actor.send({ type: 'TOGGLE_PAUSE' });
});

ui.handoffStartBtn.addEventListener('click', () => {
  actor.send({ type: 'START_TURN' });
});

ui.endGameBtn.addEventListener('click', () => {
  actor.send({ type: 'END_GAME' });
});



ui.resetBtn.addEventListener('click', () => {
  actor.send({ type: 'RESET' });
});

// ------- State subscriptions -------
actor.subscribe((state) => {
  const { context, value } = state;
  console.log('State changed:', { value, teams: context.teams.length, cards: context.allCards.length, valueType: typeof value, remainingSeconds: context.remainingSeconds });
  
  // Update team displays
  if (context.teams.length >= 1) {
    ui.team1NameDisplay.textContent = context.teams[0].name;
    ui.team1Score.textContent = context.teams[0].score;
  }
  if (context.teams.length >= 2) {
    ui.team2NameDisplay.textContent = context.teams[1].name;
    ui.team2Score.textContent = context.teams[1].score;
  }

  // Update current team highlighting
  ui.team1Card.classList.toggle('current', context.currentTeamIndex === 0);
  ui.team2Card.classList.toggle('current', context.currentTeamIndex === 1);

  // Update timer
  ui.timer.textContent = context.remainingSeconds;

  // Update deck count
  const totalCards = context.roundDeck.length + (context.currentCard ? 1 : 0);
  ui.deckCount.textContent = totalCards;

  // Update current card
  if (context.currentCard) {
    ui.currentCard.textContent = context.currentCard.word1;
    ui.currentCardSubtitle.textContent = context.currentCard.word3;
    if (context.currentCardScored) {
      ui.scoreBtn.textContent = context.currentCard.word3 + ' (+2)';
      ui.scoreBtn.className = 'score-btn score-3';
    } else {
      ui.scoreBtn.textContent = context.currentCard.word1 + ' (+1)';
      ui.scoreBtn.className = 'score-btn score-1';
    }
  } else {
    ui.currentCard.textContent = 'No more cards!';
    ui.currentCardSubtitle.textContent = '';
    ui.scoreBtn.textContent = 'Loading... (+1)';
    ui.scoreBtn.className = 'score-btn score-1';
  }

  // Update pause button
  ui.pauseBtn.textContent = context.isPaused ? 'Resume' : 'Pause';
  ui.pauseBtn.classList.toggle('paused', context.isPaused);

  // Update handoff info
  if (context.teams.length > context.currentTeamIndex) {
    ui.handoffTeam.textContent = context.teams[context.currentTeamIndex].name;
  }
  ui.handoffDeckCount.textContent = totalCards;



  // Update final scores
  if (context.teams.length >= 2) {
    const team1 = context.teams[0];
    const team2 = context.teams[1];
    const winner = team1.score > team2.score ? team1 : team2;
    
    ui.finalScores.innerHTML = `
      <div class="scores">
        <div class="team-card">
          <div>${team1.name}</div>
          <div class="team-score">${team1.score} points</div>
        </div>
        <div class="team-card">
          <div>${team2.name}</div>
          <div class="team-score">${team2.score} points</div>
        </div>
      </div>
      <h3>${winner.name} wins!</h3>
    `;
  }

  // Show/hide views based on state
  const views = ['viewLobby', 'viewTurn', 'viewHandoff', 'viewGameOver'];
  views.forEach(viewId => {
    const view = $(`#${viewId}`);
    view.classList.remove('active');
  });

  console.log('View switching logic:', { value, isLobby: value === 'lobby', isTurn: value === 'turn' || (typeof value === 'object' && value.turn && value.turn !== 'handoff'), isHandoff: typeof value === 'object' && value.turn === 'handoff', isGameOver: value === 'gameOver' });

  if (value === 'lobby') {
    ui.viewLobby.classList.add('active');
  } else if (value === 'turn' || (typeof value === 'object' && value.turn && value.turn !== 'handoff')) {
    ui.viewTurn.classList.add('active');
  } else if (value === 'gameOver') {
    ui.viewGameOver.classList.add('active');
  } else if (typeof value === 'object' && value.turn === 'handoff') {
    ui.viewHandoff.classList.add('active');
  }
});

// ------- Initialize -------
document.addEventListener('DOMContentLoaded', () => {
  loadCardData().then(() => {
    actor.start();
  });
});
