const restify = require('restify');
const mysql = require('mysql2');

const server = restify.createServer();
server.use(restify.plugins.bodyParser());

// Configurazione della connessione a MySQL
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',         // Modifica con il tuo username MySQL
    password: 'Vmware1!',    // Modifica con la tua password MySQL
    database: 'water_coolers_db' // Modifica con il nome del tuo database
});

// Connessione al database MySQL
connection.connect(err => {
    if (err) {
        console.error('Errore di connessione a MySQL:', err);
        return;
    }
    console.log('Connesso a MySQL');
});

// Endpoint GET per ottenere la lista dei "water coolers"
server.get('/water_coolers', (req, res, next) => {
    console.log('Richiesta GET per ottenere tutti i water coolers');
    connection.query('SELECT * FROM water_coolers', (err, results) => {
        if (err) {
            console.error('Errore durante la query GET:', err.code, err.message);
            res.send(500, { error: 'Errore di recupero dati' });
            return next();
        }
        console.log('Risultati ottenuti:', results);
        res.send(results);
        return next();
    });
});


// Endpoint GET per ottenere un singolo "water cooler" per ID
server.get('/water_coolers/:id', (req, res, next) => {
    const coolerId = req.params.id;
    console.log('Richiesta GET per water cooler con ID:', coolerId);
    connection.query('SELECT * FROM water_coolers WHERE id = ?', [coolerId], (err, results) => {
        if (err) {
            console.error('Errore durante la query GET per un singolo water cooler:', err.code, err.message);
            res.send(500, { error: 'Errore di recupero dati' });
            return next();
        }
        if (results.length === 0) {
            res.send(404, { message: 'Water cooler non trovato' });
        } else {
            console.log('Water cooler trovato:', results[0]);
            res.send(results[0]);
        }
        return next();
    });
});


// Endpoint POST per aggiungere un nuovo "water cooler"
server.post('/water_coolers', (req, res, next) => {
    console.log('Dati ricevuti per inserimento water cooler:', req.body);  // Log dei dati ricevuti

    const { name, temperature, status } = req.body;

    // Verifica se i dati necessari sono presenti
    if (!name || !temperature || !status) {
        console.log('Errore: Dati mancanti');
        res.send(400, { error: 'Dati mancanti: name, temperature o status non forniti' });
        return next();
    }

    connection.query('INSERT INTO water_coolers (name, temperature, status) VALUES (?, ?, ?)', 
    [name, temperature, status], (err, result) => {
        if (err) {
            console.error('Errore durante l\'inserimento:', err.code, err.message);
            res.send(500, { error: 'Errore di inserimento dati' });
            return next();
        }
        console.log('Water cooler aggiunto con ID:', result.insertId);
        res.send(201, { message: 'Water cooler aggiunto con successo', id: result.insertId });
        return next();
    });
});


// Avvio del server
server.listen(8011, () => {
    console.log('%s listening at %s', server.name, server.url);
});

