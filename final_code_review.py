import sys

def check_file(filepath, forbidden_str):
    with open(filepath, 'r') as f:
        content = f.read()

    if forbidden_str in content:
        print(f"FAIL: Found {forbidden_str} in {filepath}")
        # Find the line
        for i, line in enumerate(content.split('\n')):
            if forbidden_str in line:
                print(f"Line {i+1}: {line.strip()}")
    else:
        print(f"PASS: No {forbidden_str} in {filepath}")

check_file("index.html", "NEOCRYPTZ")
check_file("api/chat.js", "NEOCRYPTZ")
check_file("index.html", ".from('users')")
