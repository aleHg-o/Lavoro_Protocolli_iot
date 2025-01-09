using System;
using CoAP;
using CoAP.Net;

namespace NetCoreClient.Protocols
{
	internal class Coap : IProtocolInterface
	{
		private const string PATH_PREFIX = "casette/v1/id_1/sensori";
		private readonly string endpoint;

		public Coap(string endpoint)
		{
			this.endpoint = endpoint; // Esempio di endpoint: "coap://localhost"
		}

		public void Send(string data, string sensor)
		{
			try
			{
				// Costruisce l'URI completo per il sensore
				string resourceUri = $"{endpoint}/{PATH_PREFIX}/{sensor}";

				// Crea una richiesta CoAP POST
				var request = new Request(Method.POST)
				{
					URI = new Uri(resourceUri),
					PayloadString = data,
					ContentType = MediaType.TextPlain // Imposta il tipo di contenuto su testo
				};

				Console.WriteLine($"[CoAP] Inviando dati: {data} a {resourceUri}");

				// Invia la richiesta e ottiene la risposta (sincrono)
				var response = request.Send();

				// Gestisci la risposta
				if (response != null)
				{
					// Se la libreria CoAP.NET utilizza un tipo di codice diverso, potrebbe essere qualcosa come response.Code
					Console.WriteLine($"[CoAP] Risposta ricevuta: {response.Code}"); // Usa .Code per il codice di risposta
				}
				else
				{
					Console.WriteLine("[CoAP] Nessuna risposta ricevuta.");
				}
			}
			catch (Exception ex)
			{
				Console.WriteLine($"Errore durante l'invio del messaggio CoAP: {ex.Message}");
			}
		}
	}
}
