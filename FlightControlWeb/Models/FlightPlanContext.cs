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

        public DbSet<FlightPlan> FlightPlan { get; set; }
    }
}
