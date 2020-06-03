using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace FlightControlWeb.Models
{
    public class FlightPlanContext : DbContext
    {

        public FlightPlanContext(DbContextOptions<FlightPlanContext> options)
            : base(options)
        {


        }
        public DbSet<Location> First_location { get; set; }
        public DbSet<Segment> Segments { get; set; }
         public DbSet<Server> Server { get; set; }

        public DbSet<FlightPlan> FlightPlan { get; set; }

        public static Dictionary<string, Server> flightServerDictiontary = new Dictionary<string, Server>();

    }
}
