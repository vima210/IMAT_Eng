// Funzione per convertire l'input in un formato con punto
function convertToDecimal(value) {
  return parseFloat(value.replace(',', '.'));
}

// Funzione per validare l'input
function validateInput(event) {
  const input = event.target.value;
  event.target.value = input.replace(/[^0-9.,]/g, ''); // Permetti solo numeri, punto e virgola
}

// Aggiungi la validazione ai campi del form
document.getElementById('totalScore').addEventListener('input', validateInput);
document.getElementById('bioScore').addEventListener('input', validateInput);
document.getElementById('chemistryScore').addEventListener('input', validateInput);
document.getElementById('mathScore').addEventListener('input', validateInput);

// Mappa delle percentuali di esclusione per sede
const sedePercentuale = {
  "marche": 0.40,
  "messina": 0.40,
  "parma": 0.30,
  "lvanvitelli": 0.30,
  "pavia": 0.25,
  "federico": 0.30,
  "torino": 0.30,
  "bologna": 0.20,
  "bari": 0.20,
  "sapienza": 0.15,
  "padova": 0.15,
  "milano": 0.15,
  "bicocca": 0.05,
  "catania": 0.01,
  "torvergata": 0.01,
  "dent_siena": 0.05,
  "esteri": 0.82  
};

// Funzione per calcolare la posizione dell'utente nella graduatoria
function calculatePosition(tableData, totalScore, bioScore, chemistryScore, mathScore) {
  let posizione = 1;

  // Confronta ogni riga con i punteggi
  tableData.forEach(row => {
    if (row.Score > totalScore) {
      posizione++;
    } else if (row.Score === totalScore) {
      if (row.Bio > bioScore) {
        posizione++;
      } else if (row.Bio === bioScore) {
        if (row.Chemistry > chemistryScore) {
          posizione++;
        } else if (row.Chemistry === chemistryScore) {
          if (row.Mathematics > mathScore) {
            posizione++;
          }
        }
      }
    }
    
  });
  console.log(posizione);
  return posizione;
}


// Aggiungi la gestione della logica di calcolo per la posizione
document.getElementById('rankingForm').addEventListener('submit', function(e) {
  e.preventDefault();

  // Ottieni i punteggi e convertili
  const totalScore = convertToDecimal(document.getElementById('totalScore').value);
  const bioScore = convertToDecimal(document.getElementById('bioScore').value);
  const chemistryScore = convertToDecimal(document.getElementById('chemistryScore').value);
  const mathScore = convertToDecimal(document.getElementById('mathScore').value);

  // Caricamento del CSV
  fetch('graduatoria.tsv')
    .then(response => response.text())
    .then(data => {
      const rows = data.split('\n').slice(1);  // Ignora l'intestazione

      const tableData = rows.map(row => {
        const columns = row.split('\t');

        return {
          Barcode: columns[0],
          Position: columns[1],
          Gener: columns[2],
          Logica: columns[3],
          Bio: convertToDecimal(columns[4]),
          Chemistry: convertToDecimal(columns[5]),
          Mathematics: convertToDecimal(columns[6]),
          Score: convertToDecimal(columns[7]),
          Sede: columns[8].trim().toLowerCase()
        };
      });

      const posizione = calculatePosition(tableData, totalScore, bioScore, chemistryScore, mathScore);

      let posizioneFinale = 0;
      
      // Se la posizione è inferiore o uguale a 2000, calcola come prima
      if (posizione <= 2000) {
        // Raggruppa per sede e calcola quante persone devono essere escluse in base alla percentuale
        const partecipantiPerSede = {};
        tableData.slice(0, posizione).forEach(row => {
          const sede = row.Sede;
          partecipantiPerSede[sede] = (partecipantiPerSede[sede] || 0) + 1;  // Conta i partecipanti per ogni sede
        });

        let personeEscluse = 0;
        const esclusioniPerSede = {};  // Oggetto per tenere traccia delle esclusioni per ogni sede

        // Calcola esclusioni per ogni sede
        for (let sede in partecipantiPerSede) {
          const numeroPartecipanti = partecipantiPerSede[sede];
          const percentualeEsclusione = sedePercentuale[sede] || 0;
          const esclusioni = Math.floor(numeroPartecipanti * percentualeEsclusione);
          personeEscluse += esclusioni;
          esclusioniPerSede[sede] = esclusioni;
          console.log(`Sede: ${sede}, Partecipanti: ${numeroPartecipanti}, Percentuale Esclusione: ${percentualeEsclusione}, Esclusioni: ${esclusioni}`);

        }

        // Calcola la posizione finale tenendo conto delle esclusioni
        posizioneFinale = posizione - personeEscluse;
        
        
      } else {
        // Posizione > 2000, calcola separatamente fino a 2000 e oltre
        const posizioneFinoADuemila = 2000;
        const posizioneDopoDuemila = Math.abs(posizione - 2000) * 0.50;

        // Calcoliamo le esclusioni fino a 2000
        const partecipantiPerSede = {};
        tableData.slice(0, posizioneFinoADuemila).forEach(row => {
          const sede = row.Sede;
          partecipantiPerSede[sede] = (partecipantiPerSede[sede] || 0) + 1;  // Conta i partecipanti per ogni sede
        });

        let personeEscluseFinoADuemila = 0;
        const esclusioniPerSedeFinoADuemila = {};  // Oggetto per tenere traccia delle esclusioni per ogni sede fino a 2000

        // Calcola esclusioni fino a 2000
        for (let sede in partecipantiPerSede) {
          const numeroPartecipanti = partecipantiPerSede[sede];
          const percentualeEsclusione = sedePercentuale[sede] || 0;
          const esclusioni = Math.floor(numeroPartecipanti * percentualeEsclusione);
          personeEscluseFinoADuemila += esclusioni;
          esclusioniPerSedeFinoADuemila[sede] = esclusioni;
          console.log(`Sede: ${sede}, Partecipanti: ${numeroPartecipanti}, Percentuale Esclusione: ${percentualeEsclusione}, Esclusioni: ${esclusioni}`);

        }

        // Calcoliamo la posizione fino a 2000
        const posizioneFinoADuemilaFinale = posizioneFinoADuemila - personeEscluseFinoADuemila;

        // Calcoliamo la posizione finale
        posizioneFinale = posizioneFinoADuemilaFinale + posizioneDopoDuemila;
        
        
      }
      
      // Visualizza il risultato
      document.getElementById('result').innerHTML = `Your estimated position on the 10th of October is ${Math.round(posizioneFinale)}`;


      evidenziaPosizioni(tableData, posizioneFinale);

    })
    .catch(error => console.error('Errore nel caricamento del CSV:', error));
});

// Funzione per caricare e visualizzare la tabella con i dati forniti
function loadTable() {
  // Dati della tabella forniti
  const tableData = [
    { Sede: 'ROMA Sapienza', Posti: 45, Scorrimento0: 311, Ottimistico: 900, Pessimistico: 404 },
    { Sede: 'ROMA Tor Vergata', Posti: 40, Scorrimento0: 629, Ottimistico: 1825, Pessimistico: 818 },
    { Sede: 'MI Statale', Posti: 55, Scorrimento0: 277, Ottimistico: 803, Pessimistico: 360 },
    { Sede: 'BOLOGNA', Posti: 97, Scorrimento0: 439, Ottimistico: 1273, Pessimistico: 571 },
    { Sede: 'MI Bicocca', Posti: 30, Scorrimento0: 339, Ottimistico: 982, Pessimistico: 440 },
    { Sede: 'NA Federico II', Posti: 15, Scorrimento0: 381, Ottimistico: 1104, Pessimistico: 495 },
    { Sede: 'PAVIA', Posti: 103, Scorrimento0: 651, Ottimistico: 1889, Pessimistico: 847 },
    { Sede: 'BARI', Posti: 69, Scorrimento0: 941, Ottimistico: 2729, Pessimistico: 1123 },
    { Sede: 'TORINO', Posti: 70, Scorrimento0: 696, Ottimistico: 2019, Pessimistico: 905 },
    { Sede: 'VANVITELLI', Posti: 60, Scorrimento0: 880, Ottimistico: 2553, Pessimistico: 1144 },
    { Sede: 'MARCHE', Posti: 20, Scorrimento0: 830, Ottimistico: 2407, Pessimistico: 1079 },
    { Sede: 'PADOVA', Posti: 75, Scorrimento0: 578, Ottimistico: 1667, Pessimistico: 752 },
    { Sede: 'PARMA', Posti: 75, Scorrimento0: 821, Ottimistico: 2380, Pessimistico: 1067 },
    { Sede: 'CATANIA', Posti: 30, Scorrimento0: 1080, Ottimistico: 3132, Pessimistico: 1404 },
    { Sede: 'MESSINA', Posti: 55, Scorrimento0: 1056, Ottimistico: 3062, Pessimistico: 1373 },
    { Sede: 'CAGLIARI', Posti: 80, Scorrimento0: 1102, Ottimistico: 3480, Pessimistico: 1560 },
  ];

  let tableHTML = '<thead><tr><th>University</th><th>Available seats</th><th>Last available seat at first round</th><th>Last available seat FINAL round OPTIMISTIC</th><th>Last available seat FINAL round PESSIMISTIC</th></tr></thead><tbody>';

  tableData.forEach(row => {
    tableHTML += `<tr><td>${row.Sede}</td><td>${row.Posti}</td><td>${row.Scorrimento0}</td><td>${row.Ottimistico}</td><td>${row.Pessimistico}</td></tr>`;
  });

  tableHTML += '</tbody>';
  document.getElementById('scoreTable').innerHTML = tableHTML;
}

// Carica la tabella iniziale
loadTable();

// Funzione per evidenziare le righe in base alla posizione finale
// Funzione per evidenziare le righe in base alla posizione finale
// Funzione per evidenziare le righe in base alla posizione finale
// Funzione per evidenziare le righe in base alla posizione finale
function evidenziaPosizioni(tableData, posizioneFinale) {
  const rows = document.querySelectorAll('#scoreTable tbody tr');

  rows.forEach((row, index) => {
    const posizioneCell3 = row.cells[2]; // Colonna 3
    const posizioneCell4 = row.cells[3]; // Colonna 4
    const posizioneCell5 = row.cells[4]; // Colonna 5

    // Converte i valori in numero
    const posizione3 = parseFloat(posizioneCell3.innerText.replace(',', '.'));
    const posizione4 = parseFloat(posizioneCell4.innerText.replace(',', '.'));
    const posizione5 = parseFloat(posizioneCell5.innerText.replace(',', '.'));

    // Cambia colore in base alla posizione finale per le colonne 3, 4 e 5
    if (posizione3 < posizioneFinale) {
      posizioneCell3.style.color = 'red'; // Evidenzia in rosso i numeri minori della PosizioneFinale
    } else if (posizione3 > posizioneFinale) {
      posizioneCell3.style.color = 'green'; // Evidenzia in verde i numeri maggiori della PosizioneFinale
    }

    if (posizione4 < posizioneFinale) {
      posizioneCell4.style.color = 'red'; // Evidenzia in rosso i numeri minori della PosizioneFinale
    } else if (posizione4 > posizioneFinale) {
      posizioneCell4.style.color = 'green'; // Evidenzia in verde i numeri maggiori della PosizioneFinale
    }

    if (posizione5 < posizioneFinale) {
      posizioneCell5.style.color = 'red'; // Evidenzia in rosso i numeri minori della PosizioneFinale
    } else if (posizione5 > posizioneFinale) {
      posizioneCell5.style.color = 'green'; // Evidenzia in verde i numeri maggiori della PosizioneFinale
    }
  });
}




