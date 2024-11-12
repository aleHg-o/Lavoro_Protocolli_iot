using NetCoreClient.ValueObjects;
using System.Text.Json;

namespace NetCoreClient.Sensors
{
	class VirtualStatusSensor : StatusSensorInterface, ISensorInterface
	{

		private readonly StatusSensor status_sensor;

		public VirtualStatusSensor()
		{
			status_sensor = new StatusSensor("Status");
		}

		public string StatusSensor()
		{
			return status_sensor.Status;
		}

		public string ToJson()
		{
			return JsonSerializer.Serialize(StatusSensor());
		}
	}
}