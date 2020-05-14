using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;

namespace FlightControlWeb.Models
{
    public class Segment
    {
        [Key]
        public int key { get; set; }
        public string flight_id { get; set; }

        public double longitude { get; set; }
        public double latitude { get; set; }
        public double timespan_seconds { get; set; }

    }
}
