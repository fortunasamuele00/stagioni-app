# Stagioni

PWA personale: la vita come una serie, a stagioni di 13 episodi settimanali. Ogni scena fatta è un voto all'identità che stai costruendo.

Questo repo contiene **solo il codice**. I dati (stagione, giorni, episodi, lista) stanno in un repo GitHub privato separato. L'app lo legge e lo scrive con la Contents API, usando un token fine-grained inserito nelle impostazioni, che resta sul telefono in IndexedDB.

## Funzioni

- **Oggi**: scene da spuntare, antagonisti (non segnato → vinto → perso), campo "Racconta", frecce per i giorni passati.
- **Stagione**: voti giornalieri con media mobile a 7 giorni, voti totali e serie di giorni di fila.
- **Episodio**: obiettivi della settimana, Nota del regista (sola lettura) e recap.
- **Lista dei 30 giorni**: aggiungi, conto alla rovescia, "Non mi serve più".

Offline le modifiche vanno in coda e partono appena torna la rete. All'apertura l'app rilegge il repo dati.

## Sviluppo

```bash
npm install
npm run dev     # http://localhost:3305
npm run build
```

In sviluppo, senza repo collegato, l'app carica i file di `seed-data/`. La cartella resta fuori da git e fuori dalla build.

La pubblicazione su GitHub Pages parte da sola a ogni push su `main` (`.github/workflows/pages.yml`).
