// URL del tuo Foglio Google (Apps Script)
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycby5O0HEid-9adhQoYklfWZtACd_nHNVPHZLMbdDBVHlYUCZybSoe68I_KoOQMDfEk_54Q/exec";

document.addEventListener('DOMContentLoaded', () => {
    console.log("App avviata correttamente.");
    
    // Gestione pulsante Rubrica
    const btnContacts = document.getElementById('btn-contacts');
    if (btnContacts) {
        // Verifica se il browser supporta la selezione contatti
        if ('contacts' in navigator && 'Picker' in window) {
            btnContacts.style.display = 'inline-block';
        } else {
            // Se il browser (es. alcuni iPhone/Safari) non supporta l'API diretta, nascondiamo o adattiamo il pulsante
            // Nota: su Android Chrome funziona alla perfezione.
        }

        btnContacts.addEventListener('click', async () => {
            const supportedProperties = ['name', 'tel'];
            const options = { multiple: false };

            try {
                const contacts = await navigator.contacts.select(supportedProperties, options);
                if (contacts && contacts.length > 0) {
                    const contact = contacts[0];
                    
                    if (contact.name && contact.name[0]) {
                        document.getElementById('client-name').value = contact.name[0];
                    }
                    if (contact.tel && contact.tel[0]) {
                        document.getElementById('client-phone').value = contact.tel[0];
                    }
                }
            } catch (ex) {
                console.error('Selezione contatti annullata o non supportata:', ex);
                alert("Impossibile accedere alla rubrica da questo browser. Inserisci i dati manualmente.");
            }
        });
    }

    const form = document.getElementById('appointment-form');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('client-name').value;
            const phone = document.getElementById('client-phone').value;
            const datetime = document.getElementById('appointment-date').value;

            const datiForm = new URLSearchParams();
            datiForm.append('id', 'app_' + Date.now());
            datiForm.append('name', name);
            datiForm.append('phone', phone);
            datiForm.append('datetime', datetime);
            datiForm.append('note', 'Counseling');

            const btn = form.querySelector('button[type="submit"]');
            btn.textContent = "Salvataggio in corso...";
            btn.disabled = true;

            try {
                await fetch(SCRIPT_URL, {
                    method: 'POST',
                    mode: 'no-cors',
                    body: datiForm
                });

                alert(`Appuntamento salvato con successo per ${name}!`);
                form.reset();
            } catch (error) {
                console.error("Errore durante il salvataggio:", error);
                alert("Errore di connessione durante il salvataggio.");
            } finally {
                btn.textContent = "Salva e Sincronizza";
                btn.disabled = false;
            }
        });
    }
});

function handleAuthClick() {
    alert("Integrazione Google Calendar attiva.");
}
});

function handleAuthClick() {
    alert("Integrazione Google Calendar attiva.");
}
