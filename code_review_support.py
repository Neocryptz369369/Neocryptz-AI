import sys

def check_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    checks = {
        "Neocryptz Support": "Neocryptz" in content and "SUPPORT CHAT" in content,
        "Audio Alert": "support-alert-sound" in content and "industrial_alarm.ogg" in content,
        "User Details Grid": "User Registration Details" in content and "profile.full_name" in content,
        "Realtime Setup": "setupSupportRealtime" in content and "playSupportAlert" in content,
        "Admin Logic": "currentUser?.is_admin" in content and "sender_name !== 'Neocryptz'" in content
    }

    for check, passed in checks.items():
        print(f"{check}: {'PASS' if passed else 'FAIL'}")

if __name__ == "__main__":
    check_file("index.html")
