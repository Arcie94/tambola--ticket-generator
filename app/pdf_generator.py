from fpdf import FPDF
import os

def generate_pdf(tickets, filename, seed=None):
    pdf = FPDF(orientation="P", unit="mm", format="A4")
    pdf.set_auto_page_break(False)
    
    tickets_per_page = 6
    margin_x = 15
    margin_y = 15
    cell_w = 20
    cell_h = 12
    spacing_y = 10
    
    for i, ticket in enumerate(tickets):
        if i % tickets_per_page == 0:
            pdf.add_page()
            
        ticket_idx_on_page = i % tickets_per_page
        
        start_x = margin_x
        start_y = margin_y + ticket_idx_on_page * (3 * cell_h + spacing_y)
        
        # Ticket ID Header
        pdf.set_font("helvetica", "B", 10)
        pdf.set_text_color(100, 100, 100)
        pdf.set_xy(start_x, start_y - 5)
        
        ticket_label = f"Ticket ID: {seed}-{i+1}" if seed else f"Tambola Ticket #{i+1}"
        pdf.cell(180, 5, ticket_label, align="L")
        
        # Draw grid
        pdf.set_line_width(0.5)
        pdf.set_draw_color(0, 0, 0)
        
        for r in range(3):
            for c in range(9):
                x = start_x + c * cell_w
                y = start_y + r * cell_h
                
                val = ticket[r][c]
                
                if val == 0:
                    pdf.set_fill_color(240, 240, 240)
                    pdf.rect(x, y, cell_w, cell_h, style="DF")
                else:
                    pdf.set_fill_color(255, 255, 255)
                    pdf.rect(x, y, cell_w, cell_h, style="DF")
                    
                    pdf.set_font("helvetica", "B", 16)
                    pdf.set_text_color(0, 0, 0)
                    pdf.set_xy(x, y)
                    pdf.cell(cell_w, cell_h, str(val), align="C")
                    
    pdf.output(filename)
    return os.path.abspath(filename)
