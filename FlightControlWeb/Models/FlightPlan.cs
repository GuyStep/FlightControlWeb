using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;
using System.Text.Json.Serialization;


namespace FlightControlWeb.Models
{
    public class FlightPlan
    {
        [JsonIgnore]
        [Key]
        public string Flight_id { get; set; }
        public double Longitude { get; set; }
        public double Latitude { get; set; }
        public Location Initial_location { get; set; }
        public int Passengers { get; set; }
        public string Company_name { get; set; }
        [JsonIgnore]
        public string Date_time { get; set; }
        [JsonIgnore]
        public bool Is_external { get; set; }
        public List<Segment> Segments { get; set; }

    }
}
