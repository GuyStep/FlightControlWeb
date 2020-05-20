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
    public class FlightsController : ControllerBase
    {
        private readonly FlightPlanContext _context;

        public FlightsController(FlightPlanContext context)
        {
            _context = context;
        }

        // GET: api/Flights
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Flight>>> GetFlights([FromQuery] string relative_to = null, [FromQuery] bool syncAll = false)
        {
            List<Flight> flights = new List<Flight>();
            List<FlightPlan> fp = await _context.FlightPlan.ToListAsync();
            DateTime relative = new DateTime();
            if (relative_to == null)
            {
                return flights;
            }
            try
            {
                relative = DateTimeOffset.Parse(relative_to).UtcDateTime;
            }
            catch (Exception e)
            {
                //if (e.Message == "Unable to parse.")
                //{
                    return new List<Flight>();
                //}
            }
            foreach (FlightPlan element in fp)
            {
                string id = element.flight_id;
                var loc = await _context.first_location.ToListAsync();
                var seg = await _context.segments.ToListAsync();

                element.initial_location = loc.Where(a => a.flight_id.CompareTo(id) == 0).First();
                element.segments = seg.Where(a => a.flight_id.CompareTo(id) == 0).ToList();

                DateTime start = DateTimeOffset.Parse(element.initial_location.date_time).UtcDateTime;
                if (DateTime.Compare(relative, start) < 0)
                {
                    continue;
                }
                Flight fl = new Flight();
                double startLat = element.initial_location.latitude;
                double startLong = element.initial_location.longitude;
                // run over segments
                foreach (Segment s in element.segments)
                {
                    DateTime saveStart = start;
                    DateTime test = start.AddSeconds(s.timespan_seconds);
                    if (DateTime.Compare(relative, start) >= 0 &&
                        DateTime.Compare(relative, test) <= 0)
                    {
                        fl.flight_id = element.flight_id;
                        fl.company_name = element.company_name;
                        fl.date_time = element.date_time;
                        fl.is_external = element.is_external;
                        fl.latitude = element.latitude;
                        fl.longitude = element.longitude;
                        fl.passengers = element.passengers;
                        flights.Add(fl);
                        break;
                    }
                }
               /* if (syncAll)
                {
                    List<Flight> externalFlights = null;
                    foreach (Server s in _context.Server)
                    {
                        string get = s.ServerURL + "api/Flights?relative_to=" + relative_to + "&syncAll=false";
                        externalFlights = GetFlightFromSever<List<Flight>>(get);
                        foreach (Flight f in externalFlights)
                        {
                            f.Is_external = true;
                            _context.serverId[f.Flight_id] = s;
                            flights.Add(f);

                        }
                    }
                }*/















            }
                
        return flights;
    }
 


        // DELETE: api/Flights/5
        [HttpDelete("{id}")]
        public async Task<ActionResult<Flight>> DeleteFlight(string id)
        {
            FlightPlan flight = await _context.FlightPlan.FindAsync(id);
            if (flight == null)
            {
                return NotFound();
            }
            var location = await _context.first_location.ToListAsync();
            _context.first_location.Remove(location.Where(a => a.flight_id.CompareTo(id) == 0).First());

            var segmentsList = await _context.segments.ToListAsync();
            var segments = segmentsList.Where(a => a.flight_id.CompareTo(id) == 0).ToList();
            foreach (Segment element in segments)
            {
                _context.segments.Remove(element);
            }

            _context.FlightPlan.Remove(flight);
            await _context.SaveChangesAsync();

            return null;
        }

        private bool FlightExists(string id)
        {
            return _context.FlightPlan.Any(e => e.flight_id == id);
        }
    }
}
