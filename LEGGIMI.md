# Calendario promemoria — come installarla su Android

Questa è una PWA (progressive web app): un sito che si installa come un'app vera sul telefono. Per funzionare su Android — in particolare per usare la selezione dei contatti dalla rubrica — deve essere ospitata su un indirizzo **HTTPS**. Non si può installare aprendo i file da soli sul telefono.

## Modo più semplice e gratuito: GitHub Pages

1. Crea un account su github.com (se non ce l'hai già).
2. Crea un nuovo repository (es. "calendario-promemoria").
3. Carica questi 6 file nella root del repository: `index.html`, `app.js`, `manifest.json`, `sw.js`, `icon-192.png`, `icon-512.png`.
4. Nel repository vai su Settings → Pages → seleziona il branch principale come sorgente → salva.
5. Dopo un minuto GitHub ti darà un indirizzo tipo `https://tuonome.github.io/calendario-promemoria/`.
6. Apri quell'indirizzo con Chrome sul telefono Android.
7. Tocca il menu (⋮) in alto a destra → **"Aggiungi a schermata Home"** o **"Installa app"**.
8. Da quel momento l'icona compare come una vera app.

## Cosa funziona davvero

- **Aggiungere appuntamenti** con data, ora, nome e numero: sempre.
- **Selezionare il contatto dalla rubrica reale**: funziona su Chrome Android quando l'app è servita in HTTPS (come con GitHub Pages). Se il browser non supporta questa funzione, puoi comunque scrivere nome e numero a mano.
- **Invio del promemoria su WhatsApp**: apre WhatsApp con il messaggio già scritto e il numero già selezionato — l'ultimo tocco su "Invia" resta manuale, per i limiti della piattaforma WhatsApp spiegati in chat.
- **Salvataggio degli appuntamenti**: restano memorizzati sul telefono anche chiudendo l'app (localStorage), ma solo su quel dispositivo/browser — non c'è sincronizzazione tra telefoni.

## Limiti da conoscere

- Non c'è invio automatico in background: nessuna app web (né nativa, senza WhatsApp Business API) può inviare messaggi WhatsApp da sola, senza un tocco finale dell'utente.
- Gli appuntamenti non si sincronizzano tra dispositivi diversi: se vuoi condividerli con altre persone o vederli da più telefoni serve un backend (database) — se ti interessa, possiamo aggiungerlo in un secondo momento.
