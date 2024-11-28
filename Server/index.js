const restify = require('restify');
const mqtt = require('mqtt');
const mysql = require('mysql2');
const readline = require('readline');

// Crea il server RESTful
var server = restify.createServer();
server.use(restify.plugins.bodyParser());

// Configurazione della connessione al database MySQL
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Vmware1!',
    database: 'water_coolers_db'
});

// Connessione al broker MQTT
const mqttClient = mqtt.connect('mqtt://test.mosquitto.org');

// Quando il client MQTT è connesso
mqttClient.on('connect', function () {
    console.log('Connesso al broker MQTT per ricevere comandi');
    mqttClient.subscribe('casette/v1/id_1/sensori/#', function (err) {
        if (!err) {
            console.log('Sottoscritto ai topic dei comandi');
        }
    });
});

// Funzione per salvare i dati nel database in modo automatico
function saveOrUpdate(field, value) {
    const queryFind = `SELECT id FROM waters_coolers WHERE ${field} IS NULL LIMIT 1`;

    db.execute(queryFind, function (err, results) {
        if (err) {
            console.error('Errore durante la ricerca nel database:', err);
        } else if (results.length > 0) {
            const idToUpdate = results[0].id;
            const queryUpdate = `UPDATE waters_coolers SET ${field} = ? WHERE id = ?`;
            db.execute(queryUpdate, [value, idToUpdate], function (err, updateResults) {
                if (err) {
                    console.error(`Errore durante l'aggiornamento del campo ${field} nel database:`, err);
                } else {
                    console.log(`${field} aggiornato a ${value} per la riga con ID ${idToUpdate}.`);
                }
            });
        } else {
            const queryInsert = `INSERT INTO waters_coolers (${field}) VALUES (?)`;
            db.execute(queryInsert, [value], function (err, insertResults) {
                if (err) {
                    console.error(`Errore durante l'inserimento del campo ${field} nel database:`, err);
                } else {
                    console.log(`${field} inserito come ${value} in una nuova riga.`);
                }
            });
        }
    });
}

// Quando ricevi un messaggio MQTT
mqttClient.on('message', function (topic, message) {
    console.log(`Messaggio ricevuto su ${topic}:`, message.toString());

    if (topic === 'casette/v1/id_1/sensori/watertemp') {
        const temperature = parseFloat(message.toString());
        if (!isNaN(temperature)) {
            saveOrUpdate('temperature', temperature);
        } else {
            console.error('Il valore ricevuto per watertemp non è un numero valido:', message.toString());
        }
    } else if (topic === 'casette/v1/id_1/sensori/lightstate') {
        const lightstate = message.toString();
        saveOrUpdate('lightstate', lightstate);
    } else {
        console.log('Topic non gestito:', topic);
    }
});

// Aggiungi un endpoint per accendere le luci
server.post('/accendi-luci', function (req, res, next) {
    console.log('Comando ricevuto per accendere le luci');
    
    // Invia il comando MQTT per accendere le luci
    mqttClient.publish('casette/v1/id_1/sensori/lightstate', 'on', function (err) {
        if (err) {
            res.send(500, { message: 'Errore nell\'invio del comando MQTT' });
        } else {
            res.send(200, { message: 'Comando per accendere le luci inviato con successo!' });
        }
    });

    return next();
});

// Funzione per inviare il comando via MQTT quando si digita sulla tastiera
function sendCommand() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    rl.question('Inserisci il comando (on per accendere, off per spegnere): ', function (command) {
        // Controlla se il comando è valido
        if (command === 'on' || command === 'off') {
            mqttClient.publish('casette/v1/id_1/comandi/lightstate', command, function (err) {
                if (err) {
                    console.log('Errore nell\'invio del comando MQTT:', err);
                } else {
                    console.log(`Comando '${command}' inviato con successo!`);
                }
                rl.close(); // Chiudi il readline dopo aver inviato il comando
                sendCommand(); // Richiama la funzione per permettere l'inserimento di un altro comando
            });
        } else {
            console.log('Comando non valido. Inserisci "on" o "off".');
            rl.close(); // Chiudi e richiama per correggere l'errore
            sendCommand(); // Richiama la funzione per chiedere di nuovo
        }
    });
}

// Avvia la funzione di invio comandi da tastiera
sendCommand();

// Avvia il server RESTful
server.listen(8011, function () {
    console.log('%s listening at %s', server.name, server.url);
});
