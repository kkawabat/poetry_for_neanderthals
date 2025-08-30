// src/main.js
import { createActor } from 'https://esm.sh/xstate@5?bundle';
import { pfnMachine } from './lib/states.js';

// Load card data
let pfnCards = [];

// Sample Poetry for Neanderthals cards
const sampleCards = [
  { id: "1", easy: "Quiz", hard: "Pop Quiz" },
  { id: "2", easy: "Side", hard: "Bedside" },
  { id: "3", easy: "Love", hard: "Love Letter" },
  { id: "4", easy: "Mind", hard: "Mind Reader" },
  { id: "5", easy: "Tongue", hard: "Tongue-Tied" },
  { id: "6", easy: "Skin", hard: "Snake Skin" },
  { id: "7", easy: "Hair", hard: "Bad Hair Day" },
  { id: "8", easy: "Split", hard: "Split Ends" },
  { id: "9", easy: "Talk", hard: "Talk Radio" },
  { id: "10", easy: "Ghost", hard: "Ghost Town" },
  { id: "11", easy: "Fence", hard: "Electric Fence" },
  { id: "12", easy: "Window", hard: "Window Shopping" },
  { id: "13", easy: "Taco", hard: "Taco Salad" },
  { id: "14", easy: "Wedding", hard: "Wedding Ring" },
  { id: "15", easy: "Tape", hard: "Tape Recorder" },
  { id: "16", easy: "Fall", hard: "Trust Fall" },
  { id: "17", easy: "Wife", hard: "Trophy Wife" },
  { id: "18", easy: "Toilet", hard: "Toilet Paper" },
  { id: "19", easy: "Sun", hard: "Sunburn" },
  { id: "20", easy: "Golf", hard: "Mini Golf" }
];

// Load the JSON file
async function loadCardData() {
  try {
    const response = await fetch('./data/pfn_cards.json');
    pfnCards = await response.json();
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

function getCardsByCategory(category) {
  if (category === 'all') return pfnCards;
  
  // For now, just return all cards. You can implement category filtering later
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
  cardCategory: $('#cardCategory'),
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
  score3Btn: $('#score3Btn'),
  score1Btn: $('#score1Btn'),
  penaltyBtn: $('#penaltyBtn'),
  pauseBtn: $('#pauseBtn'),

  // handoff
  viewHandoff: $('#viewHandoff'),
  handoffTeam: $('#handoffTeam'),
  handoffDeckCount: $('#handoffDeckCount'),
  handoffStartBtn: $('#handoffStartBtn'),

  // between rounds
  viewBetweenRounds: $('#viewBetweenRounds'),
  betweenTeam1Name: $('#betweenTeam1Name'),
  betweenTeam2Name: $('#betweenTeam2Name'),
  betweenTeam1Score: $('#betweenTeam1Score'),
  betweenTeam2Score: $('#betweenTeam2Score'),
  betweenDeckCount: $('#betweenDeckCount'),
  betweenStartBtn: $('#betweenStartBtn'),

  // game over
  viewGameOver: $('#viewGameOver'),
  finalScores: $('#finalScores'),
  resetBtn: $('#resetBtn'),
};

// ------- State machine -------
const actor = createActor(pfnMachine);

// ------- Event handlers -------
ui.startGameBtn.addEventListener('click', () => {
  const team1Name = ui.team1Name.value.trim() || 'Team 1';
  const team2Name = ui.team2Name.value.trim() || 'Team 2';
  const seconds = parseInt(ui.secondsInput.value) || 60;
  const category = ui.cardCategory.value;
  const deckSize = parseInt(ui.deckSizeInput.value) || 20;

  // Add teams
  actor.send({ type: 'ADD_TEAM', id: 'team1', name: team1Name });
  actor.send({ type: 'ADD_TEAM', id: 'team2', name: team2Name });

  // Set game settings
  actor.send({ type: 'SET_SECONDS', seconds });

  // Set cards
  const cards = getCardsByCategory(category).slice(0, deckSize);
  actor.send({ type: 'SET_CARDS', cards });

  // Start game
  actor.send({ type: 'START_GAME' });
});

ui.score3Btn.addEventListener('click', () => {
  actor.send({ type: 'GUESS_3' });
});

ui.score1Btn.addEventListener('click', () => {
  actor.send({ type: 'GUESS_1' });
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

ui.betweenStartBtn.addEventListener('click', () => {
  actor.send({ type: 'START_TURN' });
});

ui.resetBtn.addEventListener('click', () => {
  actor.send({ type: 'RESET' });
});

// ------- State subscriptions -------
actor.subscribe((state) => {
  const { context, value } = state;
  
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
    ui.currentCard.textContent = context.currentCard.hard;
    ui.score3Btn.textContent = context.currentCard.hard + ' (+3)';
    ui.score1Btn.textContent = context.currentCard.easy + ' (+1)';
  } else {
    ui.currentCard.textContent = 'No more cards!';
    ui.score3Btn.textContent = 'Loading... (+3)';
    ui.score1Btn.textContent = 'Loading... (+1)';
  }

  // Update pause button
  ui.pauseBtn.textContent = context.isPaused ? 'Resume' : 'Pause';
  ui.pauseBtn.classList.toggle('paused', context.isPaused);

  // Update handoff info
  if (context.teams.length > context.currentTeamIndex) {
    ui.handoffTeam.textContent = context.teams[context.currentTeamIndex].name;
  }
  ui.handoffDeckCount.textContent = totalCards;

  // Update between rounds info
  if (context.teams.length >= 1) {
    ui.betweenTeam1Name.textContent = context.teams[0].name;
    ui.betweenTeam1Score.textContent = context.teams[0].score;
  }
  if (context.teams.length >= 2) {
    ui.betweenTeam2Name.textContent = context.teams[1].name;
    ui.betweenTeam2Score.textContent = context.teams[1].score;
  }
  ui.betweenDeckCount.textContent = totalCards;

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
  const views = ['viewLobby', 'viewTurn', 'viewHandoff', 'viewBetweenRounds', 'viewGameOver'];
  views.forEach(viewId => {
    const view = $(`#${viewId}`);
    view.classList.remove('active');
  });

  if (value === 'lobby') {
    ui.viewLobby.classList.add('active');
  } else if (value === 'turn') {
    ui.viewTurn.classList.add('active');
  } else if (value === 'gameOver') {
    ui.viewGameOver.classList.add('active');
  } else if (typeof value === 'object' && value.turn === 'handoff') {
    ui.viewHandoff.classList.add('active');
  } else if (value === 'betweenRounds') {
    ui.viewBetweenRounds.classList.add('active');
  }
});

// ------- Initialize -------
loadCardData().then(() => {
  actor.start();
});
