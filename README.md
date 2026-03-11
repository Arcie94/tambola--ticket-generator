# Tambola Ticket Generator

A simple Python Desktop Application that instantly generates 100 valid, print-ready Tambola (Housie) tickets and saves them as a high-quality PDF.

## Features

- **Valid Ticket Generation**: The algorithm ensures exactly 5 numbers per row, properly distributed and sorted by columns (1-9, 10-19, ..., 80-90).
- **PDF Export**: Uses `fpdf2` to create a clean, A4-sized PDF document.
- **Print Ready**: Neatly formats 6 tickets per page.
- **Simple GUI**: Includes a user-friendly desktop interface built with `tkinter`, meaning you just click a button to generate the tickets!

## Requirements

If you want to run the source code directly, you need Python installed on your machine.

- Python 3.x
- `fpdf2`

## Installation

Clone the repository and install the required dependencies:

```bash
git clone https://github.com/Arcie94/tambola--ticket-generator.git
cd tambola--ticket-generator
pip install -r requirements.txt
```

## Usage

Run the main script to open the application window:

```bash
python main.py
```

Click the **"Generate 100 Tickets (PDF)"** button. A file named `tambola_tickets.pdf` will be created in the same directory, containing your freshly generated tickets.

## Building a Standalone Executable (Windows)

If you want to share this application with friends who don't have Python installed, you can compile it into a single `.exe` file using PyInstaller:

```bash
pip install pyinstaller
pyinstaller --onefile --windowed --name "Tambola Generator Core" main.py
```

The standalone executable will be generated inside the `dist` folder.

## License

MIT
