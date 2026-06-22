with open('index.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Find the end of the script tag at 2965
target_line = -1
for i, line in enumerate(lines):
    if i + 1 == 2965:
        target_line = i
        break

if target_line != -1:
    # Check if the preceding line is a closing brace
    # If we have an 'Unexpected end of input' in Node -c, it means a brace is missing
    # Let's count total braces in the whole file
    all_content = "".join(lines)
    # This is rough as it includes CSS and HTML
    pass

# Let's look at the end of the script block
# 2964:        }
# 2965:    </script>
