using NetCoreClient.ValueObjects;
using System.Text.Json;

namespace NetCoreClient.Sensors
{
	class VirtualNameSensor : NameSensorInterface, ISensorInterface
	{

		private readonly NameSensor name_sensor;
		
		public VirtualNameSensor()
		{
			name_sensor = new NameSensor("Name");
		}

		public string NameSensor()
		{
			return name_sensor.Name;
		}

		public string ToJson()
		{
			return JsonSerializer.Serialize(NameSensor());
		}
	}
}