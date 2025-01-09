const coap = require('coap'); // Libreria CoAP
const mysql = require('mysql2');

// Configurazione della connessione a MySQL
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',         // Modifica con il tuo username MySQL
    password: 'Vmware1!', // Modifica con la tua password MySQL
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

// Funzione helper per inviare risposte CoAP
function sendResponse(res, code, payload) {
    res.code = code;
    res.end(JSON.stringify(payload));
}

// Server CoAP
const server = coap.createServer((req, res) => {
    const url = req.url.split('/');
    const method = req.method;

    // Gestione endpoint CoAP
    if (method === 'GET' && req.url === '/water_coolers') {
        console.log('Richiesta GET per ottenere tutti i water coolers');
        connection.query('SELECT * FROM water_coolers', (err, results) => {
            if (err) {
                console.error('Errore durante la query GET:', err.code, err.message);
                sendResponse(res, '5.00', { error: 'Errore di recupero dati' });
                return;
            }
            console.log('Risultati ottenuti:', results);
            sendResponse(res, '2.05', results); // 2.05 (Contenuto)
        });
    } else if (method === 'GET' && url[1] === 'water_coolers' && url[2]) {
        const coolerId = url[2];
        console.log('Richiesta GET per water cooler con ID:', coolerId);
        connection.query('SELECT * FROM water_coolers WHERE id = ?', [coolerId], (err, results) => {
            if (err) {
                console.error('Errore durante la query GET per un singolo water cooler:', err.code, err.message);
                sendResponse(res, '5.00', { error: 'Errore di recupero dati' });
                return;
            }
            if (results.length === 0) {
                sendResponse(res, '4.04', { message: 'Water cooler non trovato' }); // 4.04 (Non trovato)
            } else {
                console.log('Water cooler trovato:', results[0]);
                sendResponse(res, '2.05', results[0]); // 2.05 (Contenuto)
            }
        });
    } else if (method === 'POST' && req.url === '/water_coolers') {
        let payload = '';
        req.on('data', chunk => {
            payload += chunk;
        });

        req.on('end', () => {
            const data = JSON.parse(payload);
            console.log('Dati ricevuti per inserimento water cooler:', data);

            const { name, temperature, status } = data;

            // Verifica se i dati necessari sono presenti
            if (!name || !temperature || !status) {
                console.log('Errore: Dati mancanti');
                sendResponse(res, '4.00', { error: 'Dati mancanti: name, temperature o status non forniti' }); // 4.00 (Richiesta errata)
                return;
            }

            connection.query('INSERT INTO water_coolers (name, temperature, status) VALUES (?, ?, ?)', 
            [name, temperature, status], (err, result) => {
                if (err) {
                    console.error('Errore durante l\'inserimento:', err.code, err.message);
                    sendResponse(res, '5.00', { error: 'Errore di inserimento dati' });
                    return;
                }
                console.log('Water cooler aggiunto con ID:', result.insertId);
                sendResponse(res, '2.01', { message: 'Water cooler aggiunto con successo', id: result.insertId }); // 2.01 (Creato)
            });
        });
    } else if (method === 'POST' && req.url === '/casette/v1/id_1/sensori/watertemp') {
        let payload = '';
        req.on('data', chunk => {
            payload += chunk;
        });

        req.on('end', () => {
            const data = JSON.parse(payload);
            console.log('Dati ricevuti per watertemp:', data);

            const { sensor_id, temperature } = data;

            if (!sensor_id || !temperature) {
                sendResponse(res, '4.00', { error: 'Dati mancanti: sensor_id o temperature non forniti' });
                return;
            }

            connection.query('INSERT INTO watertemp_sensors (sensor_id, temperature) VALUES (?, ?)', 
            [sensor_id, temperature], (err, result) => {
                if (err) {
                    console.error('Errore durante l\'inserimento watertemp:', err.code, err.message);
                    sendResponse(res, '5.00', { error: 'Errore di inserimento dati' });
                    return;
                }
                console.log('Valore watertemp aggiunto con ID:', result.insertId);
                sendResponse(res, '2.01', { message: 'Temperatura aggiunta con successo', id: result.insertId });
            });
        });
    } else if (method === 'POST' && req.url === '/casette/v1/id_1/sensori/lightstate') {
        let payload = '';
        req.on('data', chunk => {
            payload += chunk;
        });

        req.on('end', () => {
            const data = JSON.parse(payload);
            console.log('Dati ricevuti per lightstate:', data);

            const { sensor_id, state } = data;

            if (!sensor_id || !state) {
                sendResponse(res, '4.00', { error: 'Dati mancanti: sensor_id o state non forniti' });
                return;
            }

            connection.query('INSERT INTO lightstate_sensors (sensor_id, state) VALUES (?, ?)', 
            [sensor_id, state], (err, result) => {
                if (err) {
                    console.error('Errore durante l\'inserimento lightstate:', err.code, err.message);
                    sendResponse(res, '5.00', { error: 'Errore di inserimento dati' });
                    return;
                }
                console.log('Valore lightstate aggiunto con ID:', result.insertId);
                sendResponse(res, '2.01', { message: 'Stato luce aggiunto con successo', id: result.insertId });
            });
        });
    } else {
        console.log('Richiesta non supportata:', req.method, req.url);
        sendResponse(res, '4.04', { error: 'Endpoint non trovato' }); // 4.04 (Non trovato)
    }
});

// Avvio del server CoAP
server.listen(() => {
    console.log('Server CoAP in ascolto sulla porta 5683');
});
