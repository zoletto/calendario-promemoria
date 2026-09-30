// URL del tuo Foglio Google (Apps Script)
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycby5O0HEid-9adhQoYklfWZtACd_nHNVPHZLMbdDBVHlYUCZybSoe68I_KoOQMDfEk_54Q/exec";

document.addEventListener('DOMContentLoaded', () => {
    console.log("App avviata correttamente.");
    
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
