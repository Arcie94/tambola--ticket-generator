# Tambola Ticket Generator & Online Calling Board

A complete solution to play Tambola (Housie) with your friends physically or remotely!
This project contains two main parts:

1. **Desktop App (Ticket Generator)** - Instantly generates 100 valid, print-ready Tambola tickets and saves them as a high-quality PDF.
2. **Multiplayer Online Board** - A mobile-friendly Web App powered by Docker & WebSockets so the Host can draw numbers while players watch the board update on their phones in real-time.

---

## 🎟️ Part 1: Desktop Ticket Generator

### Features

- **Valid Ticket Generation**: The algorithm ensures exactly 5 numbers per row, properly distributed and sorted by columns (1-9, 10-19, ..., 80-90).
- **PDF Export**: Uses `fpdf2` to create a clean, A4-sized PDF document (6 tickets per page).
- **Simple GUI**: Includes a user-friendly desktop interface built with `tkinter`.

### Usage (Windows)

You can directly download the standalone `.exe` inside the `dist` folder:

```bash
./dist/Tambola Generator Core.exe
```

Or run from source:

```bash
pip install -r requirements.txt
python main.py
```

---

## 📱 Part 2: Multiplayer Online Board (Docker)

To prevent players from accidentally drawing numbers, the Caller Board is now a real-time multiplayer Server.

### Features

- **Two Roles**:
  - **Player View (`/`)**: View-only board. Players see numbers pop up in real-time.
  - **Host View (`/host`)**: Password-protected area where the Host clicks "Pick Number".
- **Real-Time Sync**: Powered by `Flask-SocketIO`. As soon as the host picks a number, all players' screens update instantly without refreshing.
- **Mobile Friendly**: The 90-number grid gracefully resizes to fit smartly on smartphone screens.
- **Voice Announcement**: The browser automatically speaks the drawn number aloud.

### Running with Docker (Recommended)

You can host this Board on any server or VPS that has Docker installed. It will be available on Port `5000`.

1. Clone the repository to your server.
2. Start the container:

```bash
docker-compose up -d --build
```

3. Players access: `http://your-server-ip:5000/`
4. Host accesses: `http://your-server-ip:5000/host` _(Password: `admin`)_

### Running locally with Python

```bash
cd app
pip install -r requirements.txt
python server.py
```

## License

MIT
