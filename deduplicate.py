with open('index.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()

output = []
seen_vars = set()
for line in lines:
    trimmed = line.strip()
    # Handle 'let adCooldownTimer = null;'
    if trimmed == 'let adCooldownTimer = null;':
        if 'adCooldownTimer' in seen_vars:
            continue
        seen_vars.add('adCooldownTimer')

    output.append(line)

with open('index.html', 'w', encoding='utf-8') as f:
    f.writelines(output)
