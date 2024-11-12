using NetCoreClient.Sensors;
using NetCoreClient.Protocols;

// define sensors
List<ISensorInterface> sensors = new();
sensors.Add(new VirtualNameSensor());
sensors.Add(new VirtualWaterTempSensor());
sensors.Add(new VirtualStatusSensor());

// define protocol
ProtocolInterface protocol = new Http("http://eade-185-122-225-105.ngrok-free.app/water_coolers");

// send data to server
while (true)
{
    foreach (ISensorInterface sensor in sensors)
    {
        var sensorValue = sensor.ToJson();

        protocol.Send(sensorValue);

        Console.WriteLine("Data sent: " + sensorValue);

        Thread.Sleep(1000);
    }

}
