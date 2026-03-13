from flask import Flask, render_template, request, session, redirect, url_for, send_file
from flask_socketio import SocketIO, emit
import random
import os
import tambola
import pdf_generator

app = Flask(__name__)
app.config['SECRET_KEY'] = 'tambola_super_secret_key_123'
socketio = SocketIO(app, cors_allowed_origins="*")

# Game State
game_state = {
    'unpicked_numbers': list(range(1, 91)),
    'history': [],
    'current_number': None,
    'claims_locked': True  # Bingo claims are locked by default
}

# Dummy Host Password
HOST_PASSWORD = 'admin'

@app.route('/')
def player_view():
    """Player view is accessible without any authentication."""
    return render_template('player.html', state=game_state)

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        if request.form.get('password') == HOST_PASSWORD:
            session['is_host'] = True
            return redirect(url_for('host_view'))
        else:
            return render_template('login.html', error='Invalid password')
    return render_template('login.html')

@app.route('/host')
def host_view():
    if not session.get('is_host'):
        return redirect(url_for('login'))
    return render_template('host.html', state=game_state)

@app.route('/generator', methods=['GET', 'POST'])
def generator_view():
    if not session.get('is_host'):
        return redirect(url_for('login'))
    
    if request.method == 'POST':
        try:
            num = int(request.form.get('num_tickets', 100))
            if num < 1 or num > 500:
                raise ValueError("Number of tickets must be between 1 and 500.")
            
            # Generate a random 6 digit seed
            seed = random.randint(100000, 999999)
            
            tickets = tambola.generate_tickets(num, seed_val=seed)
            filepath = os.path.join('/tmp', 'tambola_tickets.pdf')
            pdf_generator.generate_pdf(tickets, filepath, seed=seed)
            
            return send_file(filepath, as_attachment=True, download_name=f'Tambola_{seed}_{num}Tickets.pdf')
        except Exception as e:
             return render_template('generator.html', error=str(e))
             
    return render_template('generator.html')

@app.route('/api/validate/<ticket_id>')
def validate_ticket(ticket_id):
    if not session.get('is_host'):
        return {"error": "Unauthorized"}, 401
        
    try:
        parts = ticket_id.split('-')
        if len(parts) != 2:
            return {"error": "Invalid Format. Expected format: SEED-NUMBER"}, 400
            
        seed = int(parts[0])
        ticket_num = int(parts[1])
        
        if ticket_num < 1:
            return {"error": "Ticket number must be 1 or greater"}, 400
            
        # Recreate the ticket deterministically
        tickets = tambola.generate_tickets(ticket_num, seed_val=seed)
        target_ticket = tickets[-1] # The last one is the requested ticket number
        
        return {
            "ticket": target_ticket,
            "drawn_numbers": game_state['history']
        }
        
    except ValueError:
        return {"error": "Invalid ticket ID format. Use numbers like 832912-5."}, 400
    except Exception as e:
        return {"error": str(e)}, 500

@app.route('/logout')
def logout():
    session.pop('is_host', None)
    return redirect(url_for('player_view'))

# WebSocket Events
@socketio.on('connect')
def handle_connect():
    """Send current game state to newly connected client."""
    emit('game_state_sync', game_state)

@socketio.on('pick_number')
def handle_pick_number():
    """Host asks to pick a new number."""
    if game_state['unpicked_numbers']:
        # Select random number
        idx = random.randint(0, len(game_state['unpicked_numbers']) - 1)
        picked = game_state['unpicked_numbers'].pop(idx)
        
        # Update state
        game_state['history'].append(picked)
        game_state['current_number'] = picked
        
        # Broadcast the new state to all connected clients (players and host)
        socketio.emit('number_picked', {
            'number': picked, 
            'history': game_state['history']
        })

@socketio.on('reset_game')
def handle_reset_game():
    """Host asks to reset the game."""
    game_state['unpicked_numbers'] = list(range(1, 91))
    game_state['history'] = []
    game_state['current_number'] = None
    game_state['claims_locked'] = True  # Re-lock claims on reset
    
    # Broadcast reset
    socketio.emit('game_reset', game_state)

@socketio.on('claim_bingo')
def handle_claim_bingo():
    """A player claims they have won. Broadcast to everyone."""
    socketio.emit('bingo_claimed')

@socketio.on('lock_bingo')
def handle_lock_bingo():
    """Host locks the bingo claim button for all players."""
    game_state['claims_locked'] = True
    socketio.emit('bingo_locked')

@socketio.on('unlock_bingo')
def handle_unlock_bingo():
    """Host unlocks the bingo claim button for all players."""
    game_state['claims_locked'] = False
    socketio.emit('bingo_unlocked')

if __name__ == '__main__':
    # Run development server
    socketio.run(app, host='0.0.0.0', port=5000, debug=True)
