const SCRIPT_URL = "https://script.google.com/macros/s/AKfycby5O0HEid-9adhQoYklfWZtACd_nHNVPHZLMbdDBVHlYUCZybSoe68I_KoOQMDfEk_54Q/exec";

document.addEventListener('DOMContentLoaded', () => {
    console.log("App avviata correttamente.");
    
    const btnContacts = document.getElementById('btn-contacts');
    if (btnContacts) {
        btnContacts.addEventListener('click', async () => {
            // Verifica se l'API dei contatti è supportata dal browser
            if (!('contacts' in navigator && 'select' in navigator.contacts)) {
                alert("Il tuo browser non supporta la selezione diretta dei contatti. Inserisci i dati manualmente.");
                return;
            }

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
                        // Pulisce eventuali spazi o trattini dal numero di telefono
                        let phoneNum = contact.tel[0].replace(/\s+/g, '');
                        document.getElementById('client-phone').value = phoneNum;
                    }
                }
            } catch (ex) {
                console.error('Selezione contatti annullata o non permessa:', ex);
                // Non mostriamo alert se l'utente ha semplicemente chiuso la rubrica senza scegliere nessuno
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
