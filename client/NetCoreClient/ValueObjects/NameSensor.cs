namespace NetCoreClient.ValueObjects
{
	internal class NameSensor
	{
		public string Name {  get; private set; }
		

		public NameSensor(string name)
		{ 
			this.Name = name;
		}

		
	}
}
