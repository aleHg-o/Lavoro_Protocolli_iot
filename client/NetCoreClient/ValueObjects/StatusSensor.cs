namespace NetCoreClient.ValueObjects
{
	internal class StatusSensor
	{
		public string Status { get; private set; }


		public StatusSensor(string status)
		{
			this.Status = status;
		}


	}
}
