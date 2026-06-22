with open('index.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()

output = []
for line in lines:
    if 'function checkMacros()' in line:
        output.append('        function checkMacros() {\n')
    else:
        output.append(line)

with open('index.html', 'w', encoding='utf-8') as f:
    f.writelines(output)
