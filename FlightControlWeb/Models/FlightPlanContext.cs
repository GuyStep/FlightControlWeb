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
        public DbSet<Location> first_location { get; set; }
        public DbSet<Segment> segments { get; set; }
        //public DbSet<Flight> flight { get; set; }
        public DbSet<Server> server { get; set; }

        public DbSet<FlightPlan> FlightPlan { get; set; }

        public static Dictionary<string, Server> flightServerDictiontary = new Dictionary<string, Server>();

    }
}
