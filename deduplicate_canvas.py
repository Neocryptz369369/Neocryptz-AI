import sys

with open('index.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()

output = []
skip = 0
seen_canvas = False
for i, line in enumerate(lines):
    if skip > 0:
        skip -= 1
        continue

    if 'function generateCanvas()' in line:
        if seen_canvas:
            # Skip this duplicate function
            # Find end of function
            j = i
            while j < len(lines) and '}' not in lines[j]:
                j += 1
            skip = j - i
            continue
        else:
            seen_canvas = True
            output.append(line)
    else:
        output.append(line)

with open('index.html', 'w', encoding='utf-8') as f:
    f.writelines(output)
