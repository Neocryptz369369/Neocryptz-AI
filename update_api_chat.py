import re

with open('api/chat.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Pattern to find systemKeys object
keys_pattern = r'const systemKeys = \{[\s\S]*?\};'
new_keys = '''const systemKeys = {
        'GOOGLE_API_KEY': process.env.GOOGLE_API_KEY || "",
        'OPENROUTER_API_KEY': process.env.OPENROUTER_API_KEY || "",
        'POLLINATIONS_API_KEY': process.env.POLLINATIONS_API_KEY || "",
        'GROQ_API_KEY': process.env.GROQ_API_KEY || "",
        'GITHUB_TOKEN': process.env.GITHUB_TOKEN || "",
        'VERCEL_TOKEN': process.env.VERCEL_TOKEN || ""
    };'''

content = re.sub(keys_pattern, new_keys, content)

with open('api/chat.js', 'w', encoding='utf-8') as f:
    f.write(content)
