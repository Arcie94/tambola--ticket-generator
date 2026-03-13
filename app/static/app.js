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
    numberHistoryDisplay.innerHTML = '';
    
    if (history.length > 0) {
        // Get the latest 5 numbers (excluding the very current one if it's currently being animated and not finalized yet)
        // Wait, 'history' already contains the latest picked number at the end.
        // During the 1.5s spin, we show the history *excluding* the number currently spinning.
        // If animate is true, the number hasn't finalized yet visually, but it is in 'history'.
        // To be perfectly accurate: we should show the last 5 finalized numbers.
        // Let's just always show up to the 5 numbers BEFORE the very last one in history array.
        let past5 = [];
        if (history.length > 1) {
            past5 = history.slice(0, -1).slice(-5).reverse();
        }

        if (past5.length > 0) {
            past5.forEach(num => {
                const ball = document.createElement('div');
                ball.className = 'history-ball';
                ball.textContent = num;
                numberHistoryDisplay.appendChild(ball);
            });
        } else {
            const emptyTxt = document.createElement('span');
            emptyTxt.style.color = '#64748b';
            emptyTxt.style.fontSize = '12px';
            emptyTxt.textContent = 'None yet';
            numberHistoryDisplay.appendChild(emptyTxt);
        }
    } else {
        const emptyTxt = document.createElement('span');
        emptyTxt.style.color = '#64748b';
        emptyTxt.style.fontSize = '12px';
        emptyTxt.textContent = 'None yet';
        numberHistoryDisplay.appendChild(emptyTxt);
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
    const validateBtn = document.getElementById('validateBtn');
    const ticketIdInput = document.getElementById('ticketIdInput');
    const validationResult = document.getElementById('validationResult');

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

    if (validateBtn && ticketIdInput && validationResult) {
        validateBtn.addEventListener('click', () => {
            const ticketId = ticketIdInput.value.trim();
            if (!ticketId) return;
            
            validateBtn.disabled = true;
            validateBtn.textContent = '...';
            
            fetch(`/api/validate/${ticketId}`)
                .then(response => response.json())
                .then(data => {
                    if (data.error) {
                        validationResult.innerHTML = `<span style="color: #ef4444;">${data.error}</span>`;
                        validationResult.style.display = 'block';
                        return;
                    }
                    
                    const ticket = data.ticket;
                    const drawn = new Set(data.drawn_numbers);
                    
                    let gridHtml = '<div class="ticket-preview">';
                    for (let r = 0; r < 3; r++) {
                        for (let c = 0; c < 9; c++) {
                            const val = ticket[r][c];
                            if (val === 0) {
                                gridHtml += `<div class="ticket-cell empty"></div>`;
                            } else {
                                const isMatched = drawn.has(val);
                                const cellClass = isMatched ? 'matched' : 'unmatched';
                                gridHtml += `<div class="ticket-cell ${cellClass}">${val}</div>`;
                            }
                        }
                    }
                    gridHtml += '</div>';
                    
                    validationResult.innerHTML = gridHtml;
                    validationResult.style.display = 'block';
                })
                .catch(err => {
                    validationResult.innerHTML = `<span style="color: #ef4444;">Error occurred during validation.</span>`;
                    validationResult.style.display = 'block';
                })
                .finally(() => {
                    validateBtn.disabled = false;
                    validateBtn.textContent = 'Check';
                });
        });
    }

    // --- BINGO CLAIM BUTTON (Player only) ---
    const claimBingoBtn = document.getElementById('claimBingoBtn');
    const bingoCooldownMsg = document.getElementById('bingoCooldownMsg');
    
    if (claimBingoBtn) {
        const COOLDOWN_SECONDS = 60;
        
        claimBingoBtn.addEventListener('click', () => {
            // Layer 2: Double Confirmation
            const confirmed = confirm('🏆 Apakah Anda YAKIN ingin mengklaim Bingo?\n\nKlaim palsu akan mengganggu permainan!');
            if (!confirmed) return;
            
            // Send the claim via WebSocket
            socket.emit('claim_bingo');
            
            // Layer 1: 60-second Cooldown
            claimBingoBtn.disabled = true;
            let secondsLeft = COOLDOWN_SECONDS;
            bingoCooldownMsg.style.display = 'block';
            bingoCooldownMsg.textContent = `Tombol terkunci selama ${secondsLeft} detik...`;
            
            const cooldownInterval = setInterval(() => {
                secondsLeft--;
                bingoCooldownMsg.textContent = `Tombol terkunci selama ${secondsLeft} detik...`;
                if (secondsLeft <= 0) {
                    clearInterval(cooldownInterval);
                    claimBingoBtn.disabled = false;
                    bingoCooldownMsg.style.display = 'none';
                }
            }, 1000);
        });
    }
    
    // --- HOST-ONLY: Dismiss Button ---
    const dismissBingoBtn = document.getElementById('dismissBingoBtn');
    if (dismissBingoBtn) {
        dismissBingoBtn.addEventListener('click', () => {
            const overlay = document.getElementById('bingoOverlay');
            if (overlay) overlay.style.display = 'none';
        });
    }
});

// --- Listen for bingo_claimed event (EVERYONE sees this) ---
socket.on('bingo_claimed', () => {
    const overlay = document.getElementById('bingoOverlay');
    if (!overlay) return;
    
    overlay.style.display = 'flex';
    
    // Play an alert sound if the device supports it
    if ('AudioContext' in window || 'webkitAudioContext' in window) {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(ctx.destination);
            oscillator.type = 'square';
            oscillator.frequency.setValueAtTime(880, ctx.currentTime);
            gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
            oscillator.start(ctx.currentTime);
            oscillator.stop(ctx.currentTime + 0.8);
        } catch(e) {}
    }
    
    // Auto-dismiss after 8 secs for player view (no dismiss button)
    const dismissBtn = document.getElementById('dismissBingoBtn');
    if (!dismissBtn) {
        setTimeout(() => {
            overlay.style.display = 'none';
        }, 8000);
    }
});
