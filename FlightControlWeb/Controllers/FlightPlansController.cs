using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FlightControlWeb.Models;


namespace FlightControlWeb.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class FlightPlansController : ControllerBase
    {
        private readonly FlightPlanContext _context;

        public FlightPlansController(FlightPlanContext context)
        {
            _context = context;
        }

        // GET: api/FlightPlans
        [HttpGet]
        public async Task<ActionResult<IEnumerable<FlightPlan>>> GetFlightPlan()
        {
            List<FlightPlan> fp = await _context.FlightPlan.ToListAsync();
            foreach (FlightPlan element in fp)
            {
                string id = element.flight_id;
                var loc = await _context.first_location.ToListAsync();
                var seg = await _context.segments.ToListAsync();

                element.initial_location = loc.Where(a => a.flight_id.CompareTo(id) == 0).First();
                element.segments = seg.Where(a => a.flight_id.CompareTo(id) == 0).ToList();
            }
            return fp;
        }

        // GET: api/FlightPlans/5
        [HttpGet("{id}")]
        public async Task<ActionResult<FlightPlan>> GetFlightPlan(string id)
        {
            var flightPlan = await _context.FlightPlan.FindAsync(id);

            if (flightPlan == null)
            {
                return NotFound();
            }


            var loc = await _context.first_location.ToListAsync();
            var seg = await _context.segments.ToListAsync();

            flightPlan.initial_location = loc.Where(a => a.flight_id.CompareTo(id) == 0).First();
            flightPlan.segments = seg.Where(a => a.flight_id.CompareTo(id) == 0).ToList();



            return flightPlan;
        }


        // POST: api/FlightPlans
        // To protect from overposting attacks, enable the specific properties you want to bind to, for
        // more details, see https://go.microsoft.com/fwlink/?linkid=2123754.
        [HttpPost]
        public async Task<ActionResult<FlightPlan>> PostFlightPlan(FlightPlan flightPlan)
        {
/*            _context.FlightPlan.Add(flightPlan);
            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException)
            {
                if (FlightPlanExists(flightPlan.flight_id))
                {
                    return Conflict();
                }
                else
                {
                    throw;
                }
            }*/

            //SET ID
            flightPlan.flight_id = getNewId(flightPlan.company_name.ToString(), flightPlan.initial_location.date_time.ToString());
            flightPlan.date_time = flightPlan.initial_location.date_time;
            flightPlan.longitude = flightPlan.initial_location.longitude;
            flightPlan.latitude = flightPlan.initial_location.latitude;
            _context.FlightPlan.Add(flightPlan);
            //create flight with the relevent flight id. *** the flight id is placed just when adding it to the DataBase
            var loc = flightPlan.initial_location;
            loc.flight_id = flightPlan.flight_id;
            _context.first_location.Add(loc);
            var seg = flightPlan.segments;
            foreach (Segment element in seg)
            {
                element.flight_id = flightPlan.flight_id;
                _context.segments.Add(element);
            }
            await _context.SaveChangesAsync();

            return CreatedAtAction("GetFlightPlan", new { id = flightPlan.flight_id }, flightPlan);
        }

        private bool FlightPlanExists(string id)
        {
            return _context.FlightPlan.Any(e => e.flight_id == id);
        }

        private string getNewId(string company,string time)
        {
            string ID = "";
            ID += company.Substring(0, 2);
            ID += time.Substring(5, 2);
            ID += time.Substring(8, 2);

            var rand = new Random();
            int num = rand.Next(0, 10);

            ID += num;
            num = rand.Next(0, 10);
            ID += num;

            return ID;
        }
    }
}

