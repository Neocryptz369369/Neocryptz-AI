import re

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix multi-line prompt variations
variation_pattern = r'(prompt:\s*)\"(Provide 2 totally different style variations for the following prompt\. Format exactly like this:.*?)(\s*\"\s*\+\s*msg)'
def fix_variation(match):
    prefix = match.group(1)
    text = match.group(2)
    suffix = match.group(3)
    cleaned_text = text.replace('\n', '\\n').replace('\"', '\\\"')
    return f'{prefix}\"{cleaned_text}\"{suffix}'

content = re.sub(variation_pattern, fix_variation, content, flags=re.DOTALL)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)
