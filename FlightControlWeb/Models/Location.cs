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
        public int key { get; set; }

        public string flight_id { get; set; }
        public double longitude { get; set; }
        public double latitude { get; set; }
        public string date_time { get; set; }
    }
}
