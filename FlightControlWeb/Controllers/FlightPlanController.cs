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
    public class FlightPlanController : ControllerBase
    {
        private readonly FlightPlanContext _context;

        public FlightPlanController(FlightPlanContext context)
        {
            _context = context;
        }

        // GET: api/FlightPlan
        [HttpGet]
        public async Task<ActionResult<IEnumerable<FlightPlan>>> GetFlightPlan()
        {
            List<FlightPlan> flightPlans = await _context.FlightPlan.ToListAsync();
            foreach (FlightPlan element in flightPlans)
            {
                string id = element.Flight_id;
                var locations = await _context.First_location.ToListAsync();
                var segments = await _context.Segments.ToListAsync();

                element.Initial_location = locations.Where(a => a.Flight_id.CompareTo(id) == 0).First();
                element.Segments = segments.Where(a => a.Flight_id.CompareTo(id) == 0).ToList();
            }
            return flightPlans;
        }

        // GET: api/FlightPlan/5
        [HttpGet("{id}")]
        public async Task<ActionResult<FlightPlan>> GetFlightPlan(string id)
        {
            FlightPlan resultFlightPlan;
            var flightPlan = await _context.FlightPlan.FindAsync(id);
            if (flightPlan != null)
            {
                var locations = await _context.First_location.ToListAsync();
                var segments = await _context.Segments.ToListAsync();
                segments = segments.OrderBy(o => o.Key).ToList(); //Sort the segments by the rigths order of flight

                flightPlan.Initial_location = locations.Where(a => a.Flight_id.CompareTo(id) == 0).First();
                flightPlan.Segments = segments.Where(a => a.Flight_id.CompareTo(id) == 0).ToList();
                resultFlightPlan = flightPlan;
            }
            else
            {
                //receive server info for the requested flight
                //var server = FlightPlanContext.flightServerDictiontary[id]; 
                resultFlightPlan = requestSingleFlight(flightPlan, id);

            }
            if (resultFlightPlan != null)
            {
                return resultFlightPlan;
            }
            return NotFound();

        }

        private FlightPlan requestSingleFlight(FlightPlan flightPlan, string id)
        {
            try
            {
                var server = FlightPlanContext.flightServerDictiontary[id];

                if (server == null) //Check if the flight has a valid server
                {
                    return null;
                }
                string getRequest = server.ServerURL + "/api/FlightPlan/" + id;
                flightPlan = FlightsController.ReceiveExternal<FlightPlan>(getRequest);
                if (flightPlan == null)
                {
                    return null;
                }
            }
            catch (Exception)
            {
                return null;
            }

            return flightPlan;
        }

        // POST: api/FlightPlan
        // To protect from overposting attacks, enable the specific properties you want to bind to, for
        // more details, see https://go.microsoft.com/fwlink/?linkid=2123754.
        [HttpPost]
        public async Task<ActionResult<FlightPlan>> PostFlightPlan(FlightPlan flightPlan)
        {
            string company = flightPlan.Company_name.ToString();
            string date = flightPlan.Initial_location.Date_time.ToString();
            flightPlan.Flight_id = GetNewId(company, date); //Generate id
            List<FlightPlan> fp = await _context.FlightPlan.ToListAsync();
            //If the id exists (some digits are random), we re-generate a new one
            var exist = fp.Where(a => a.Flight_id.CompareTo(flightPlan.Flight_id) == 0).ToList();
            while (exist.Count != 0)
            {
                flightPlan.Flight_id = GetNewId(company, date);
                exist = fp.Where(a => a.Flight_id.CompareTo(flightPlan.Flight_id) == 0).ToList();
            }

            flightPlan.Date_time = flightPlan.Initial_location.Date_time;
            flightPlan.Longitude = flightPlan.Initial_location.Longitude;
            flightPlan.Latitude = flightPlan.Initial_location.Latitude;
            _context.FlightPlan.Add(flightPlan);
            var location = flightPlan.Initial_location;
            location.Flight_id = flightPlan.Flight_id;
            _context.First_location.Add(location);
            var segments = flightPlan.Segments;
            foreach (Segment element in segments) //loop over flight plan segments and add to context
            {
                element.Flight_id = flightPlan.Flight_id;
                _context.Segments.Add(element);
            }
            await _context.SaveChangesAsync();

            return CreatedAtAction("GetFlightPlan", new { id = flightPlan.Flight_id }, flightPlan);
        }

        private bool FlightPlanExists(string id)
        {
            return _context.FlightPlan.Any(e => e.Flight_id == id);
        }

        //Generate new id
        private string GetNewId(string company, string time)
        {
            string ID = "";
            ID += company.Substring(0, 2);//Use 2 first chars of the company name 
            ID += time.Substring(5, 2);//Use month number
            ID += time.Substring(8, 2);//Use day number

            //Add 2 random digits
            var rand = new Random();
            int num = rand.Next(0, 10);

            ID += num;
            num = rand.Next(0, 10);
            ID += num;

            return ID;
        }
    }
}

