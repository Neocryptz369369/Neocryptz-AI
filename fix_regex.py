with open('index.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()

output = []
skip = 0
for i in range(len(lines)):
    if skip > 0:
        skip -= 1
        continue
    line = lines[i]
    if '}).replace(/' in line and i + 1 < len(lines) and '/g, \'<br>\');' in lines[i+1]:
        output.append('            }).replace(/\\n/g, \'<br>\');\n')
        skip = 1
    else:
        output.append(line)

with open('index.html', 'w', encoding='utf-8') as f:
    f.writelines(output)
