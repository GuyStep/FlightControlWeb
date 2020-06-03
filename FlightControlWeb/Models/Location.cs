using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;

namespace FlightControlWeb.Models
{
    public class Location
    {
        [Key]
        public int Key { get; set; }
        public string Flight_id { get; set; }
        public double Longitude { get; set; }
        public double Latitude { get; set; }
        public string Date_time { get; set; }
    }
}
