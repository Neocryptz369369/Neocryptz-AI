import sys

def replace_in_file(filename, search_text, replace_text):
    with open(filename, 'r') as f:
        content = f.read()
    if search_text not in content:
        print(f"Search text not found in {filename}")
        return False
    new_content = content.replace(search_text, replace_text)
    with open(filename, 'w') as f:
        f.write(new_content)
    print(f"Successfully updated {filename}")
    return True

search_text = """        function generateCanvas() {
            const b1 = document.getElementById('canvas-1').value.trim();
            const b2 = document.getElementById('canvas-2').value.trim();
            const b3 = document.getElementById('canvas-3').value.trim();
            if(!b1 || !b2 || !b3) return alert("Fill in all boxes!");

            const prompt = `${b1} aimed at ${b2}. ${b3}.`;

        async function runPolisher() {"""

replace_text = """        function generateCanvas() {
            const b1 = document.getElementById('canvas-1').value.trim();
            const b2 = document.getElementById('canvas-2').value.trim();
            const b3 = document.getElementById('canvas-3').value.trim();
            if(!b1 || !b2 || !b3) return alert("Fill in all boxes!");

            const prompt = `${b1} aimed at ${b2}. ${b3}.`;
            document.getElementById('message-input').value = prompt;
            closeModal('canvas-modal');
        }

        async function runPolisher() {"""

replace_in_file('index.html', search_text, replace_text)
