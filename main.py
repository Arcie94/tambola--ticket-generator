import tkinter as tk
from tkinter import messagebox
import threading
import os
import subprocess
import platform

from tambola import generate_tickets
from pdf_generator import generate_pdf

def open_file(filepath):
    if platform.system() == 'Darwin':       # macOS
        subprocess.call(('open', filepath))
    elif platform.system() == 'Windows':    # Windows
        os.startfile(filepath)
    else:                                   # linux variants
        subprocess.call(('xdg-open', filepath))

def generate_action():
    btn.config(state=tk.DISABLED, text="Generating...")
    
    def worker():
        try:
            tickets = generate_tickets(100)
            filename = "tambola_tickets.pdf"
            abs_path = generate_pdf(tickets, filename)
            
            def success():
                response = messagebox.askyesno("Success", f"Successfully generated 100 tickets!\n\nSaved at:\n{abs_path}\n\nDo you want to open it now?")
                btn.config(state=tk.NORMAL, text="Generate 100 Tickets (PDF)")
                if response:
                    open_file(abs_path)
                    
            root.after(0, success)
        except Exception as e:
            root.after(0, lambda: messagebox.showerror("Error", f"An error occurred:\n{str(e)}"))
            root.after(0, lambda: btn.config(state=tk.NORMAL, text="Generate 100 Tickets (PDF)"))
            
    threading.Thread(target=worker).start()

root = tk.Tk()
root.title("Tambola Ticket Generator")
root.geometry("400x250")
root.resizable(False, False)

# Styling
root.configure(bg="#f0f0f0")

title_lbl = tk.Label(root, text="Tambola Generator", font=("Helvetica", 18, "bold"), bg="#f0f0f0", fg="#333333")
title_lbl.pack(pady=(30, 10))

desc_lbl = tk.Label(root, text="Generate 100 valid, print-ready tickets\nin a beautiful PDF format.", font=("Helvetica", 10), bg="#f0f0f0", fg="#666666", justify="center")
desc_lbl.pack(pady=(0, 30))

btn = tk.Button(root, text="Generate 100 Tickets (PDF)", font=("Helvetica", 12, "bold"), bg="#ff7f50", fg="white", activebackground="#ff6347", activeforeground="white", width=25, height=2, borderwidth=0, cursor="hand2", command=generate_action)
btn.pack()

root.mainloop()
