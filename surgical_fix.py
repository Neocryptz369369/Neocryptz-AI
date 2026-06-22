with open('index.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Clean up banUser
start_idx = -1
for i, line in enumerate(lines):
    if 'async function banUser(userId)' in line:
        start_idx = i
        break

if start_idx != -1:
    end_idx = -1
    for i in range(start_idx, len(lines)):
        if 'async function grantManualPlan(' in lines[i]:
            for j in range(i-1, start_idx, -1):
                if lines[j].strip() == '}':
                    end_idx = j
                    break
            break

    if end_idx != -1:
        new_ban = '''        async function banUser(userId) {
            let users = JSON.parse(localStorage.getItem('localUsers') || '{}');
            let foundUserKey = Object.keys(users).find(k => users[k].id === userId || users[k].username === userId);
            if (foundUserKey) {
                users[foundUserKey].banned = true;
                localStorage.setItem('localUsers', JSON.stringify(users));
            }

            try {
                await supabaseClient.from('users').update({ banned: true }).eq('id', userId);
            } catch(e) { console.log(e); }

            alert("User has been completely BANNED.");
            loadAdminData();
            loadUsersAndLogs();
        }
'''
        lines[start_idx:end_idx+1] = [new_ban]

with open('index.html', 'w', encoding='utf-8') as f:
    f.writelines(lines)
