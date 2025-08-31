# Poetry for Neanderthals Webapp

A web-based implementation of the Poetry for Neanderthals card game, adapted from the Moniker template.

**🎮 [Play the game online](https://kkawabat.github.io/poetry_for_neanderthals/)**

## How to Play

Poetry for Neanderthals is a team-based word-guessing game where players take turns describing cards to their teammates.

### Game Rules

1. **Two teams** compete against each other
2. Each turn, one player from a team becomes the "poet" and describes cards to their teammates
3. Each card contains:
   - A **3-point word** (the main word to guess)
   - A **1-point word** (a simpler related word)
4. If teammates guess the 3-point word correctly, the team gets 3 points
5. If teammates guess the 1-point word correctly, the team gets 1 point
6. If the poet makes a mistake (says forbidden words), their team gets a **1-point penalty**
7. The timer runs until time runs out, then the next player takes their turn
8. After everyone has had a turn, the team with the most points wins!

### Forbidden Words

The poet cannot say:
- The exact words on the card
- Rhyming words
- Words that sound similar
- Abbreviations or variations

## How to Run

1. **Start the server**: Run this command in the project directory:
   ```bash
   python3 -m http.server 8080
   ```

2. **Open the game**: Navigate to `http://localhost:8080/src/index.html` in your web browser

3. **Set up the game**:
   - Enter team names
   - Set the turn timer (default: 60 seconds)
   - Choose card category and deck size
   - Click "Start Game"

4. **Play the game**:
   - Pass the device to the current poet
   - They describe the card to their teammates
   - Use the buttons to:
     - **Correct! (+3 pts)**: When the 3-point word is guessed
     - **Skip**: To skip a difficult card
     - **Penalty (-1 pt)**: When the poet makes a mistake

## Game Features

- **Pass-and-play design**: Perfect for sharing one device
- **Timer system**: Configurable turn duration
- **Score tracking**: Real-time score updates
- **Card variety**: 100+ sample cards included
- **Responsive design**: Works on desktop and mobile

## Technical Details

- **Frontend**: Vanilla JavaScript with XState v5 for state management
- **No build process**: Runs directly in the browser
- **Card data**: JSON-based card system for easy customization
- **Modern UI**: Clean, responsive design

## Customizing Cards

You can add your own cards by editing `src/data/pfn_cards.json`. Each card should have:
- `id`: Unique identifier
- `word3`: The 3-point word (main word to guess)
- `word1`: The 1-point word (simpler related word)

Example:
```json
{
  "id": "101",
  "word3": "Elephant",
  "word1": "Big"
}
```

## Development

The game uses the same architecture as the Moniker template:
- `src/index.html`: Main HTML file
- `src/main.js`: UI logic and event handlers
- `src/lib/states.js`: XState state machine
- `src/data/pfn_cards.json`: Card data

Enjoy playing Poetry for Neanderthals!
