using System;
using RabbitMQ.Client;

namespace NetCoreClient.Protocols
{
	public interface ICustomModel
	{
		void ExchangeDeclare(string exchange, string type, bool durable);

		void BasicPublish(string exchange, string routingKey, IBasicProperties basicProperties, byte[] body);

		void Close();
	}
}
