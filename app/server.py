from flask import Flask, render_template, request, session, redirect, url_for
from flask_socketio import SocketIO, emit
import random

app = Flask(__name__)
app.config['SECRET_KEY'] = 'tambola_super_secret_key_123'
socketio = SocketIO(app, cors_allowed_origins="*")

# Game State
game_state = {
    'unpicked_numbers': list(range(1, 91)),
    'history': [],
    'current_number': None
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
    
    # Broadcast reset
    socketio.emit('game_reset', game_state)

if __name__ == '__main__':
    # Run development server
    socketio.run(app, host='0.0.0.0', port=5000, debug=True)
