with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

def count_braces(text, start_marker, end_marker):
    start = text.find(start_marker)
    end = text.find(end_marker, start)
    if start == -1 or end == -1:
        return None
    block = text[start:end]
    return block.count('{'), block.count('}')

# Check the main script block
print("Main Block:", count_braces(content, '<script>', '</script>'))
