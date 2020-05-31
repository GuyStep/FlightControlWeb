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
        public string flight_id { get; set; }
        public double longitude { get; set; }
        public double latitude { get; set; }
        public Location initial_location { get; set; }
        public int passengers { get; set; }
        public string company_name { get; set; }
        [JsonIgnore]
        public string date_time { get; set; }
        [JsonIgnore]
        public bool is_external { get; set; }
        public List<Segment> segments { get; set; }

    }
}
