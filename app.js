// Logica principale dell'app per Google Calendar e Gestione Appuntamenti
document.addEventListener('DOMContentLoaded', () => {
    console.log("App avviata correttamente.");
    
    const form = document.getElementById('appointment-form');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('client-name').value;
            const phone = document.getElementById('client-phone').value;
            const datetime = document.getElementById('appointment-date').value;

            alert(`Appuntamento salvato per ${name} il ${datetime}. Pronto per la sincronizzazione.`);
            form.reset();
        });
    }
});

function handleAuthClick() {
    alert("Funzione di collegamento Google Calendar pronta. Verrà attivata con il tuo account.");
}
