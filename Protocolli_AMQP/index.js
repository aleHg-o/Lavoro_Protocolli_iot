const restify = require('restify');
const amqp = require('amqplib');
const mysql = require('mysql2');

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

// Configurazione RabbitMQ
const amqpUrl = 'amqps://rjhprpzg:8iHjoEBkkFJmUiqivcGf9SN4dBO6lVyX@cow.rmq2.cloudamqp.com/rjhprpzg';
let channel; // Canale RabbitMQ per pubblicazione e sottoscrizione

async function setupRabbitMQ() {
    try {
        const connection = await amqp.connect(amqpUrl);
        channel = await connection.createChannel();

        // Assicura che le code esistano
        await channel.assertQueue('casette.v1.id_1.sensori.watertemp');
        await channel.assertQueue('casette.v1.id_1.sensori.lightstate');
        console.log('Connesso a RabbitMQ e code create.');
        
        // Consuma i messaggi delle code
        consumeMessages();
    } catch (err) {
        console.error('Errore nella configurazione di RabbitMQ:', err);
    }
}

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

// Funzione per consumare i messaggi dalle code
function consumeMessages() {
    channel.consume('casette.v1.id_1.sensori.watertemp', (msg) => {
        if (msg !== null) {
            const message = msg.content.toString();
            console.log(`Messaggio ricevuto su watertemp: ${message}`);
            const temperature = parseFloat(message);
            if (!isNaN(temperature)) {
                saveOrUpdate('temperature', temperature);
            } else {
                console.error('Il valore ricevuto per watertemp non è un numero valido:', message);
            }
            channel.ack(msg);
        }
    });

    channel.consume('casette.v1.id_1.sensori.lightstate', (msg) => {
        if (msg !== null) {
            const lightstate = msg.content.toString();
            console.log(`Messaggio ricevuto su lightstate: ${lightstate}`);
            saveOrUpdate('lightstate', lightstate);
            channel.ack(msg);
        }
    });
}

// Avvia la configurazione RabbitMQ e inizia a consumare messaggi
setupRabbitMQ();

// Avvia il server RESTful (se serve per espandere le API in futuro)
server.listen(8011, function () {
    console.log('%s listening at %s', server.name, server.url);
});
