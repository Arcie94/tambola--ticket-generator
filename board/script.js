document.addEventListener('DOMContentLoaded', () => {
    const boardGrid = document.getElementById('boardGrid');
    const pickBtn = document.getElementById('pickBtn');
    const resetBtn = document.getElementById('resetBtn');
    const currentNumberDisplay = document.getElementById('currentNumber');
    const numberHistoryDisplay = document.getElementById('numberHistory');

    let unpickedNumbers = [];
    let history = [];

    // Initialize the game
    function initGame() {
        boardGrid.innerHTML = '';
        unpickedNumbers = [];
        history = [];
        
        // Generate grid 1..90
        for (let i = 1; i <= 90; i++) {
            unpickedNumbers.push(i);
            
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.textContent = i;
            cell.id = `cell-${i}`;
            boardGrid.appendChild(cell);
        }

        updateUI();
        currentNumberDisplay.textContent = '--';
        currentNumberDisplay.classList.remove('pop-animation');
        pickBtn.disabled = false;
        pickBtn.textContent = 'Pick Number';
    }

    // Pick a random number
    function pickNumber() {
        if (unpickedNumbers.length === 0) {
            alert('All numbers have been picked!');
            return;
        }

        // Select random index
        const randomIndex = Math.floor(Math.random() * unpickedNumbers.length);
        const pickedNum = unpickedNumbers.splice(randomIndex, 1)[0];
        
        // Add to history
        history.push(pickedNum);

        // Update UI
        updateUI();
        
        // Animate the main display
        currentNumberDisplay.textContent = pickedNum;
        currentNumberDisplay.classList.remove('pop-animation');
        void currentNumberDisplay.offsetWidth; // trigger reflow
        currentNumberDisplay.classList.add('pop-animation');

        // Highlight the board cell
        const targetCell = document.getElementById(`cell-${pickedNum}`);
        if(targetCell) {
            targetCell.classList.add('picked');
        }

        // Optional: Speak the number
        speakNumber(pickedNum);

        // Check game over
        if (unpickedNumbers.length === 0) {
            pickBtn.disabled = true;
            pickBtn.textContent = 'Game Over';
        }
    }

    // Update history UI
    function updateUI() {
        if (history.length === 0) {
            numberHistoryDisplay.textContent = 'Past 5: none';
        } else {
            // Get last 5 excluding the very last one (which is current)
            let past5 = history.slice(-6, -1).reverse();
            if(past5.length === 0 && history.length > 0) {
                numberHistoryDisplay.textContent = 'Past 5: none';
            } else if (past5.length > 0) {
                numberHistoryDisplay.textContent = `Past 5: ${past5.join(', ')}`;
            }
        }
    }

    // Text to Speech
    function speakNumber(num) {
        if ('speechSynthesis' in window) {
            // Cancel any ongoing speech
            window.speechSynthesis.cancel();
            
            const text = `Number ${num}`;
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 0.9; // Slightly slower for clarity
            window.speechSynthesis.speak(utterance);
        }
    }

    // Event Listeners
    pickBtn.addEventListener('click', pickNumber);
    
    resetBtn.addEventListener('click', () => {
        if(confirm('Are you sure you want to reset the entire board?')) {
            initGame();
        }
    });

    // Start
    initGame();
});
