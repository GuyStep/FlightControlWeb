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
        public async Task<ActionResult<IEnumerable<Flight>>> GetFlights()
        {

            //var cont = await _context.FlightPlan.ToListAsync();
            ////cont = cont.Where(a => a.flight_id == "1234").ToList();

            //return cont;
            _context.SaveChanges();

            List<Flight> flights = new List<Flight>();
            List<FlightPlan> fp = await _context.FlightPlan.ToListAsync();
            foreach (FlightPlan element in fp)
            {
                Flight fl = new Flight();
                fl.flight_id = element.flight_id;
                fl.company_name = element.company_name;
                fl.date_time = element.date_time;
                fl.is_external = element.is_external;
                fl.latitude = element.latitude;
                fl.longitude = element.longitude;
                fl.passengers = element.passengers;


                flights.Add(fl);
            }
            return flights;
        }

        // GET: api/Flights/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Flight>> GetFlight(string id)
        {
            //var flight = await _context.FlightPlan.FindAsync(id);

            //if (flight == null)
            //{
            //    return NotFound();
            //}

            //return flight;
            return null;
        }

        // PUT: api/Flights/5
        // To protect from overposting attacks, enable the specific properties you want to bind to, for
        // more details, see https://go.microsoft.com/fwlink/?linkid=2123754.
        [HttpPut("{id}")]
        public async Task<IActionResult> PutFlight(string id, Flight flight)
        {
            if (id != flight.flight_id)
            {
                return BadRequest();
            }

            _context.Entry(flight).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!FlightExists(id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            return NoContent();
        }

        // POST: api/Flights
        // To protect from overposting attacks, enable the specific properties you want to bind to, for
        // more details, see https://go.microsoft.com/fwlink/?linkid=2123754.
        [HttpPost]
        public async Task<ActionResult<Flight>> PostFlight(Flight flight)
        {
            //_context.FlightPlan.Add(flight);
            //try
            //{
            //    await _context.SaveChangesAsync();
            //}
            //catch (DbUpdateException)
            //{
            //    if (FlightExists(flight.flight_id))
            //    {
            //        return Conflict();
            //    }
            //    else
            //    {
            //        throw;
            //    }
            //}

            //return CreatedAtAction("GetFlight", new { id = flight.flight_id }, flight);
            return null;

        }

        // DELETE: api/Flights/5
        [HttpDelete("{id}")]
        public async Task<ActionResult<Flight>> DeleteFlight(string id)
        {
            //var flight = await _context.FlightPlan.FindAsync(id);
            //if (flight == null)
            //{
            //    return NotFound();
            //}

            //_context.FlightPlan.Remove(flight);
            //await _context.SaveChangesAsync();

            //return flight;
            return null;

        }

        private bool FlightExists(string id)
        {
            return _context.FlightPlan.Any(e => e.flight_id == id);
        }
    }
}
