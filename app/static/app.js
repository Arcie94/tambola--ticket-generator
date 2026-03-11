const socket = io();

const currentNumberDisplay = document.getElementById('currentNumber');
const numberHistoryDisplay = document.getElementById('numberHistory');

// Initialize Board UI
function renderBoard(unpicked, history) {
    for (let i = 1; i <= 90; i++) {
        const cell = document.getElementById(`cell-${i}`);
        if (cell) {
            if (history.includes(i)) {
                cell.classList.add('picked');
            } else {
                cell.classList.remove('picked');
            }
        }
    }
}

let rouletteInterval = null;

function updateDisplays(number, history, animate = false) {
    if (number) {
        // Clear any existing animation to prevent overlap
        if (rouletteInterval) {
            clearInterval(rouletteInterval);
            rouletteInterval = null;
        }

        if (animate) {
            // Apply the spinning visual effect
            currentNumberDisplay.classList.remove('pop-animation');
            
            // Start roulette spinning
            let spins = 0;
            const maxSpins = 30; // approx 1.5 seconds at 50ms interval
            
            rouletteInterval = setInterval(() => {
                currentNumberDisplay.textContent = Math.floor(Math.random() * 90) + 1;
                spins++;
                
                if (spins >= maxSpins) {
                    clearInterval(rouletteInterval);
                    rouletteInterval = null;
                    finalizeNumberDisplay(number);
                }
            }, 50);
            
        } else {
            // No animation requested (e.g., initial load/sync)
            finalizeNumberDisplay(number);
        }
        
    } else {
        currentNumberDisplay.textContent = '--';
    }

    function finalizeNumberDisplay(finalNumber) {
        currentNumberDisplay.textContent = finalNumber;
        currentNumberDisplay.classList.remove('pop-animation');
        void currentNumberDisplay.offsetWidth; // trigger reflow
        currentNumberDisplay.classList.add('pop-animation');
        
        // Target cell
        const cell = document.getElementById(`cell-${finalNumber}`);
        if(cell) cell.classList.add('picked');
        
        // Speak
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(`Number ${finalNumber}`);
            utterance.rate = 0.9;
            window.speechSynthesis.speak(utterance);
        }
    }

    // History Pick
    if (history.length === 0) {
        numberHistoryDisplay.textContent = 'Past 5: none';
    } else {
        let past5 = history.slice(-6, -1).reverse();
        if(past5.length === 0 && history.length > 0) {
            numberHistoryDisplay.textContent = 'Past 5: none';
        } else if (past5.length > 0) {
            numberHistoryDisplay.textContent = `Past 5: ${past5.join(', ')}`;
        }
    }
}

// Socket Listeners
socket.on('game_state_sync', (state) => {
    console.log("Syncing state", state);
    renderBoard(state.unpicked_numbers, state.history);
    updateDisplays(state.current_number, state.history, false);
});

socket.on('number_picked', (data) => {
    updateDisplays(data.number, data.history, true); // True to trigger animation
});

socket.on('game_reset', (state) => {
    // Stop any running animations immediately
    if (typeof rouletteInterval !== 'undefined' && rouletteInterval) {
        clearInterval(rouletteInterval);
        rouletteInterval = null;
    }
    renderBoard(state.unpicked_numbers, state.history);
    updateDisplays(state.current_number, state.history, false);
});

// HOST ONLY LOGIC
document.addEventListener('DOMContentLoaded', () => {
    const pickBtn = document.getElementById('pickBtn');
    const resetBtn = document.getElementById('resetBtn');

    if (pickBtn) {
        pickBtn.addEventListener('click', () => {
            socket.emit('pick_number');
        });
    }

    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            if(confirm('Are you absolutely sure you want to reset the board for EVERYONE?')) {
                socket.emit('reset_game');
            }
        });
    }
});
