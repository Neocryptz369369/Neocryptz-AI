            } else {
                if (await checkGeoBlock()) return;
                if (!document.getElementById('reg-tos').checked) return alert('Agree to terms');
                if (!email || !pass) return alert("Enter all details");

                const fullName = document.getElementById('reg-name')?.value || '';
                const address = document.getElementById('reg-address')?.value || '';
                const city = document.getElementById('reg-city')?.value || '';
                const state = document.getElementById('reg-state')?.value || '';
                const zip = document.getElementById('reg-zip')?.value || '';
                const fullAddress = `${address}, ${city}, ${state} ${zip}`;
                const phone = document.getElementById('reg-phone')?.value || '';
                const age = document.getElementById('reg-age')?.value || '';

                let supaError = null;
                try {
                    const { data, error } = await supabaseClient.auth.signUp({
                        email: validEmail,
                        password: pass,
                        options: { data: { full_name: fullName, address: fullAddress, phone: phone, age: age } }
                    });
                    supaError = error;
                } catch(err) { supaError = err; }

                // Verify uniqueness
                let users = JSON.parse(localStorage.getItem('localUsers') || '{}');

                // If it's the admin or a local test, bypass IP check
                if (username.toLowerCase() !== 'neocryptz') {
                    // Simple IP constraint mock (would be done backend normally)
                    const ipConstraint = localStorage.getItem('registered_ip');
                    if (ipConstraint && ipConstraint !== username) {
                         // Only allow one non-admin account
                         alert("Registration Failed: Only one account is allowed per IP.");
                         return;
                    }
                    localStorage.setItem('registered_ip', username);
                }

                // Always save to local storage as fallback and for Admin view

                const betaInput = document.getElementById('reg-beta-code') ? document.getElementById('reg-beta-code').value.trim() : '';
                const activeBeta = localStorage.getItem('activeBetaCode') || 'NEO-BETA-2027';
                let startingCredits = 25;
                if (betaInput && betaInput === activeBeta) {
                    startingCredits = 100;
                    alert("Beta Code Accepted! 100 Credits Applied to Account.");
                }

                users[username] = {
                    username: username,
                    email: validEmail,
                    password: pass,
                    full_name: fullName,
                    address: fullAddress,
                    phone: phone,
                    age: age,
                    plan: "Free",
                    credits: startingCredits,
                    banned: false,
                    is_admin: (username.toLowerCase() === 'neocryptz')
                };
                localStorage.setItem('localUsers', JSON.stringify(users));

                // Sync to Supabase profiles table if authenticated
                if (supabaseClient) {
                    supabaseClient.auth.getSession().then(({ data: { session } }) => {
                        if (session) {
                            supabaseClient.from('profiles').upsert({
                                id: session.user.id,
                                username: username,
                                full_name: fullName,
                                email: validEmail,
                                address: fullAddress,
                                phone: phone,
                                age: age
                            }).then(() => console.log("Profile synced to Supabase")).catch(err => console.log("Profile sync error", err));
                        }
                    });
                }

                if (supaError && (supaError.message.includes('email_address_invalid') || supaError.message.includes('not allowed'))) {
                     alert('Registered successfully locally (Supabase email validation bypassed). Please Login.');
                     toggleAuth();
                } else if (supaError) {
                    alert('Registration fallback active. Saved locally. Supabase error: ' + supaError.message);
                    toggleAuth();
                } else {
                    alert('Registered successfully. Please Login.');
                    toggleAuth();
                }
            }
        }

        // Also update the logout function to sign out of Supabase
        async function logout() {
            try { await supabaseClient.auth.signOut(); } catch(e){ console.log(e); }
            localStorage.removeItem('token');
            localStorage.removeItem('currentUser');
            location.reload();
        }


        document.addEventListener('DOMContentLoaded', () => {
            const input = document.getElementById('message-input');
            if(input) {
                input.addEventListener('input', () => {
                    const counter = document.getElementById('char-counter');
                    if(counter) {
                        const len = input.value.length;
                        counter.innerText = len + " / 300 Chars";
                        if (len > 250) counter.style.color = '#ff0000';
                        else if (len > 200) counter.style.color = '#ff8c00';
                        else counter.style.color = '#aaa';
                    }
                });
            }
        });

        let recognition;
        function toggleVoiceInput() {
            if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
                alert("Voice input is not supported in this browser. Try Chrome or Edge.");
                return;
            }
            if (recognition) {
                recognition.stop();
                recognition = null;
                document.getElementById('mic-btn').style.color = 'var(--primary)';
                return;
            }

            const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
            recognition = new SpeechRec();
            recognition.continuous = false;
            recognition.interimResults = false;

            recognition.onstart = function() {
                document.getElementById('mic-btn').style.color = '#ff0000'; // Recording red
                document.getElementById('message-input').placeholder = "Listening...";
            };

            recognition.onresult = function(event) {
                const transcript = event.results[0][0].transcript;
                document.getElementById('message-input').value += (document.getElementById('message-input').value ? ' ' : '') + transcript;
            };

            recognition.onend = function() {
                document.getElementById('mic-btn').style.color = 'var(--primary)';
                document.getElementById('message-input').placeholder = "Enter command or question...";
                recognition = null;
            };

            recognition.start();
        }

        async function sendMessage() {
            const input = document.getElementById('message-input');
            checkMacros();
            let msg = input.value.trim();

            let isFlashcard = false;
            let displayMsg = msg;
            if (msg.startsWith('/flashcard')) {
                isFlashcard = true;
                displayMsg = "Generate a short, flashcard definition for: " + msg.replace('/flashcard', '').trim();
            }

            if (!msg) return;
