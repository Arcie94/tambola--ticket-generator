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

function updateDisplays(number, history) {
    // Current Pick
    if (number) {
        currentNumberDisplay.textContent = number;
        currentNumberDisplay.classList.remove('pop-animation');
        void currentNumberDisplay.offsetWidth; // trigger reflow
        currentNumberDisplay.classList.add('pop-animation');
        
        // Target cell
        const cell = document.getElementById(`cell-${number}`);
        if(cell) cell.classList.add('picked');
        
        // Speak
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(`Number ${number}`);
            utterance.rate = 0.9;
            window.speechSynthesis.speak(utterance);
        }
    } else {
        currentNumberDisplay.textContent = '--';
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
    updateDisplays(state.current_number, state.history);
});

socket.on('number_picked', (data) => {
    updateDisplays(data.number, data.history);
});

socket.on('game_reset', (state) => {
    renderBoard(state.unpicked_numbers, state.history);
    updateDisplays(state.current_number, state.history);
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
