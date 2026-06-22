import re

def check_braces(filename):
    with open(filename, 'r') as f:
        content = f.read()

    scripts = re.findall(r'<script>([\s\S]*?)<\/script>', content)

    total_errors = 0
    for i, script in enumerate(scripts):
        stack = []
        lines = script.split('\n')
        for j, line in enumerate(lines):
            for char in line:
                if char == '{':
                    stack.append((j, char))
                elif char == '}':
                    if stack:
                        stack.pop()
                    else:
                        print(f"Extra closing brace at script {i}, line {j+1}: {line.strip()}")
                        total_errors += 1

        if stack:
            print(f"Unclosed braces in script {i}:")
            for line_no, char in stack:
                print(f"  Line {line_no+1}: {lines[line_no].strip()}")
            total_errors += len(stack)

    return total_errors

errors = check_braces('index.html')
if errors == 0:
    print("All script blocks have balanced braces.")
else:
    print(f"Total brace errors: {errors}")
