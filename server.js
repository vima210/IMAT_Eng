const express = require('express');
const path = require('path');
const app = express();
const port = 3000;

// Servire file statici dalla cartella IMAT
app.use(express.static(__dirname));

// Rotta principale per servire il file index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Avvia il server
app.listen(port, () => {
  console.log(`Server in esecuzione su http://localhost:${port}`);
});
