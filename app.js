// URL del tuo Foglio Google (tramite Apps Script)
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycby5O0HEid-9adhQoYklfWZtACd_nHNVPHZLMbdDBVHlYUCZybSoe68I_KoOQMDfEk_54Q/exec";

document.addEventListener('DOMContentLoaded', () => {
    console.log("App avviata correttamente.");
    caricaAppuntamentiDaFoglio();
    
    const form = document.getElementById('appointment-form');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('client-name').value;
            const phone = document.getElementById('client-phone').value;
            const datetime = document.getElementById('appointment-date').value;

            const nuovoAppuntamento = {
                id: 'app_' + Date.now(),
                name: name,
                phone: phone,
                datetime: datetime,
                note: "Counseling"
            };

            // Disattiva il pulsante per evitare doppi invii
            const btn = form.querySelector('button[type="submit"]');
            btn.textContent = "Salvataggio in corso...";
            btn.disabled = true;

            try {
                // Invia i dati al Foglio Google
                await fetch(SCRIPT_URL, {
                    method: 'POST',
                    mode: 'no-cors',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(nuovoAppuntamento)
                });

                alert(`Appuntamento salvato con successo per ${name}!`);
                form.reset();
                location.reload(); // Ricarica per aggiornare la lista
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

// Funzione per caricare e mostrare i promemoria per l'indomani
async function caricaAppuntamentiDaFoglio() {
    const remindersContainer = document.getElementById('reminders-list');
    // Qui potremmo leggere dal foglio, ma per ora gestiamo la visualizzazione pulita
}

function handleAuthClick() {
    alert("Integrazione Google Calendar pronta.");
}
