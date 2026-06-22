with open('index.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()

output = []
skip = 0
for i, line in enumerate(lines):
    if skip > 0:
        skip -= 1
        continue

    # Identify the orphan fragment of generateCanvas
    if "document.getElementById('message-input').value = prompt;" in line and i > 2200:
        # Check if it lacks the function start
        # Look back a few lines
        if 'function generateCanvas()' not in lines[i-1] and 'function generateCanvas()' not in lines[i-2]:
            # This is likely the orphan part
            # Skip until the closing brace
            j = i
            while j < len(lines) and '}' not in lines[j]:
                j += 1
            skip = j - i
            continue

    output.append(line)

with open('index.html', 'w', encoding='utf-8') as f:
    f.writelines(output)
