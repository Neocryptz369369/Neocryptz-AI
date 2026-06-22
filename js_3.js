    let selectedSupportUserId = null;
    let supportSubscription = null;

    async function loadSupportUsers() {
        if (!currentUser || !currentUser.is_admin) return;
        const { data, error } = await supabaseClient
            .from('support_messages')
            .select('user_id, sender_name, created_at')
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Error loading support users:", error);
            return;
        }

        const userList = document.getElementById('support-user-list');
        userList.innerHTML = '';

        // Unique user IDs from messages
        const uniqueUserIds = [...new Set(data.filter(m => m.user_id).map(m => m.user_id))];

        if (uniqueUserIds.length === 0) {
            userList.innerHTML = '<p style="color: #aaa; text-align: center;">No active support requests.</p>';
            return;
        }

        for (const uid of uniqueUserIds) {
            const { data: profile } = await supabaseClient.from('profiles').select('*').eq('id', uid).single();
            const lastMsg = data.find(m => m.user_id === uid);

            const div = document.createElement('div');
            div.className = 'neon-border';
            div.style.padding = '10px';
            div.style.marginBottom = '10px';
            div.style.cursor = 'pointer';
            div.style.background = selectedSupportUserId === uid ? 'rgba(138, 43, 226, 0.2)' : '#111';
            div.innerHTML = `<strong>${profile?.username || 'Unknown User'}</strong><br><small style="color: #666;">${new Date(lastMsg.created_at).toLocaleString()}</small>`;
            div.onclick = () => selectSupportUser(uid, profile);
            userList.appendChild(div);
        }
    }

    async function selectSupportUser(uid, profile) {
        selectedSupportUserId = uid;
        document.getElementById("support-user-details").innerHTML = `
            <div style="background: rgba(138, 43, 226, 0.1); padding: 10px; border: 1px solid #8a2be2; border-radius: 5px;">
                <h4 style="margin: 0 0 10px 0; color: #fff; text-transform: uppercase; letter-spacing: 1px;">User Registration Details</h4>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                    <div><strong>Username:</strong> ${profile.username || "N/A"}</div>
                    <div><strong>Full Name:</strong> ${profile.full_name || "N/A"}</div>
                    <div><strong>Email:</strong> ${profile.email || "N/A"}</div>
                    <div><strong>Phone:</strong> ${profile.phone || "N/A"}</div>
                    <div><strong>Address:</strong> ${profile.address || "N/A"}</div>
                    <div><strong>Age:</strong> ${profile.age || "N/A"}</div>
                </div>
            </div>
        `;
        loadSupportMessages(uid, true);
        loadSupportUsers(); // Refresh list to update highlight
    }

    async function loadSupportMessages(uid, isAdminView) {
        const { data, error } = await supabaseClient
            .from('support_messages')
            .select('*')
            .eq('user_id', uid)
            .order('created_at', { ascending: true });

        if (error) return console.error(error);

        const chatBox = document.getElementById(isAdminView ? 'admin-support-chat-box' : 'user-support-chat-box');
        chatBox.innerHTML = '';
        data.forEach(msg => {
            const msgDiv = document.createElement('div');
            msgDiv.style.marginBottom = '10px';
            msgDiv.style.padding = '5px';
            msgDiv.style.borderRadius = '5px';
            msgDiv.style.background = msg.sender_name === 'Neocryptz' ? 'rgba(0, 255, 255, 0.1)' : 'rgba(255, 0, 255, 0.1)';
            msgDiv.innerHTML = `<strong style="color: ${msg.sender_name === 'Neocryptz' ? 'var(--secondary)' : 'var(--primary)'}">${msg.sender_name}:</strong> ${escapeHtml(msg.message)}`;
            chatBox.appendChild(msgDiv);
        });
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    async function sendSupportMessage(isAdmin) {
        const inputId = isAdmin ? 'admin-support-input' : 'user-support-input';
        const msg = document.getElementById(inputId).value.trim();
        if (!msg) return;

        const uid = isAdmin ? selectedSupportUserId : (await supabaseClient.auth.getSession()).data.session?.user.id;
        if (!uid) return alert("User not identified.");

        const senderName = isAdmin ? 'Neocryptz' : (currentUser?.username || 'User');

        const { error } = await supabaseClient
            .from('support_messages')
            .insert([{ user_id: uid, sender_name: senderName, message: msg }]);

        if (error) {
            alert("Error sending message: " + error.message);
        } else {
            document.getElementById(inputId).value = '';
            loadSupportMessages(uid, isAdmin);
        }
    }

    function setupSupportRealtime() {
        if (!supabaseClient) return;

        supabaseClient
            .channel('support_messages')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'support_messages' }, payload => {
                const newMsg = payload.new;

                // Alert logic
                if (currentUser?.is_admin && newMsg.sender_name !== 'Neocryptz') {
                    // Admin gets notified of user messages
                    playSupportAlert();
                    if (selectedSupportUserId === newMsg.user_id) {
                        loadSupportMessages(newMsg.user_id, true);
                    }
                    loadSupportUsers();
                } else if (!currentUser?.is_admin && newMsg.sender_name === 'Neocryptz') {
                    // User gets notified of admin messages
                    supabaseClient.auth.getSession().then(({ data: { session } }) => {
                        if (session && session.user.id === newMsg.user_id) {
                            playSupportAlert();
                            loadSupportMessages(newMsg.user_id, false);
                        }
                    });
                }
            })
            .subscribe();
    }

    function playSupportAlert() {
        const audio = document.getElementById('support-alert-sound');
        if (audio) {
            audio.volume = 1.0;
            audio.play().catch(e => console.log("Audio play blocked", e));
        }
    }

    // Initialize support realtime after login/init
    setTimeout(() => {
        setupSupportRealtime();
        if (currentUser && !currentUser.is_admin) {
            supabaseClient.auth.getSession().then(({ data: { session } }) => {
                if (session) loadSupportMessages(session.user.id, false);
            });
        }
    }, 3000);
