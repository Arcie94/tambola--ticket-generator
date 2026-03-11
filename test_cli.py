from tambola import generate_tickets
from pdf_generator import generate_pdf

tickets = generate_tickets(100)
abs_path = generate_pdf(tickets, "test_tambola_tickets.pdf")
print("Generated headlessly at", abs_path)
