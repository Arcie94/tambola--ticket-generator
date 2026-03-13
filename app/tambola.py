import random

def get_decade_range(col):
    if col == 0:
        return 1, 9
    elif col == 8:
        return 80, 90
    else:
        return col * 10, col * 10 + 9

def generate_ticket():
    while True:
        layout = [[0] * 9 for _ in range(3)]
        for r in range(3):
            cols = random.sample(range(9), 5)
            for c in cols:
                layout[r][c] = 1
        
        col_sums = [sum(layout[r][c] for r in range(3)) for c in range(9)]
        if 0 not in col_sums:
            break
            
    ticket = [[0] * 9 for _ in range(3)]
    for c in range(9):
        count = col_sums[c]
        if count > 0:
            start, end = get_decade_range(c)
            nums = sorted(random.sample(range(start, end + 1), count))
            num_idx = 0
            for r in range(3):
                if layout[r][c] == 1:
                    ticket[r][c] = nums[num_idx]
                    num_idx += 1
    return ticket

def generate_tickets(n):
    return [generate_ticket() for _ in range(n)]

if __name__ == "__main__":
    t = generate_ticket()
    for row in t:
        print(row)
