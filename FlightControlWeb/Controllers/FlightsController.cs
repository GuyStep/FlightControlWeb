using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FlightControlWeb.Models;
using System.Net;
using System.IO;
using Newtonsoft.Json;

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
            DateTime relative = new DateTime();
            List<FlightPlan> flightPlans = await _context.FlightPlan.ToListAsync();
            List<Location> locations = await _context.First_location.ToListAsync();
            List<Segment> segments = await _context.Segments.ToListAsync();
            if (relative_to == null) return flights; //No argument passed, return empty list
            try
            {
                relative = DateTimeOffset.Parse(relative_to).UtcDateTime; //Check if time is valid
            }
            catch
            {
                return flights; //Invalid argument passed, return empty list
            }
            flights = AddRelevantFlights(relative, flightPlans, locations, segments, flights);
            if (syncAll) //If syncall argument passed, get all relevant external flights 
            {
                List<Flight> externalFlights = GetExternalFlights(relative_to);
                if (externalFlights == null) { //No external flights, return only the internal
                    return flights;
                }
                foreach (Flight exf in externalFlights) flights.Add(exf);
            }
            return flights;
        }

        private  List<Flight> AddRelevantFlights(DateTime relative, List<FlightPlan> flightPlans, List<Location> loc, List<Segment> seg, List<Flight> flights)
        {

            foreach (FlightPlan element in flightPlans)
            {
                string id = element.Flight_id;

                element.Initial_location = loc.Where(a => a.Flight_id.CompareTo(id) == 0).First();
                element.Segments = seg.Where(a => a.Flight_id.CompareTo(id) == 0).ToList();

                DateTime takeOffTime = DateTimeOffset.Parse(element.Initial_location.Date_time).UtcDateTime;
                if (DateTime.Compare(relative, takeOffTime) < 0) continue; //Flight takeoff is after current time

                double startLat = element.Initial_location.Latitude;
                double startLong = element.Initial_location.Longitude;

                DateTime prevoiousStart = takeOffTime;
                flights = AddSingleFlight(element, relative, takeOffTime, flights);
            }
            return flights;
        }
        private List<Flight> AddSingleFlight(FlightPlan element, DateTime relative, DateTime takeOffTime, List<Flight> flights)
        {
            DateTime test = takeOffTime;
            Flight fl = new Flight();
            foreach (Segment segment in element.Segments)
            {
                test = test.AddSeconds(segment.Timespan_seconds);
                //Check if each segment is withing the valid time frame
                if (DateTime.Compare(relative, takeOffTime) >= 0 &&
                    DateTime.Compare(relative, test) <= 0)
                {
                    fl.Flight_id = element.Flight_id;
                    fl.Company_name = element.Company_name;
                    fl.Date_time = element.Date_time;
                    fl.Is_external = element.Is_external;
                    fl.Latitude = element.Latitude;
                    fl.Longitude = element.Longitude;
                    fl.Passengers = element.Passengers;
                    flights.Add(fl);
                    break; //No need to check the rest, the first match is the relevant one
                }
            }
            return flights;
        }

        private List<Flight> GetExternalFlights(string relative_to)
        {
            List<Flight> externalFlights = new List<Flight>();
            foreach (Server server in _context.Server) //Loop over all the servers, and get their flights
            {   

                relative_to = relative_to.Substring(0, 19) + 'Z'; //Trim unnesecary digits
                string get = server.ServerURL + "/api/Flights?relative_to=" + relative_to;
                try
                {
                    externalFlights = ReceiveExternal<List<Flight>>(get);
                }
                catch (System.Net.WebException)
                {
                    continue;
                }
                if (externalFlights == null) return externalFlights; //No external flights here
                externalFlights = UpdateExternalFlights(externalFlights, server);
            }
            _context.SaveChanges();
            return externalFlights;
        }
        private List<Flight> UpdateExternalFlights(List<Flight> externalFlights, Server server)
        {
            foreach (Flight flight in externalFlights)
            {
                flight.Is_external = true;
                try //Add pair flight:server to dictionary
                {
                    FlightPlanContext.flightServerDictiontary.Add(flight.Flight_id, server);
                }
                catch
                {
                    continue;
                }
            }
            return externalFlights;
        }
        public static T ReceiveExternal<T>(string requestUrl)
        {
            string get = String.Format(requestUrl);
            WebRequest request = WebRequest.Create(get);
            request.Method = "GET";
            HttpWebResponse response = (HttpWebResponse)request.GetResponse();
            string result = null;
            using (Stream stream = response.GetResponseStream()) //Receiving data from external server
            {
                StreamReader streamReader = new StreamReader(stream);
                result = streamReader.ReadToEnd();
                streamReader.Close();
            }
            if (result == "" || result == null) //Recieved empty response
            {
                return default;
            }
            T externalFlights = default(T);
            try //Convert to json using serialization
            {
                externalFlights = JsonConvert.DeserializeObject<T>(result); 
            }
            catch
            {
                return default; //Couldnt convert, return empty object
            }
            return externalFlights;
        }

        // DELETE: api/Flights/5
        [HttpDelete("{id}")]
        public async Task<ActionResult<Flight>> DeleteFlight(string id)
        {
            FlightPlan flight = await _context.FlightPlan.FindAsync(id);
            if (flight == null)
            {
                return NotFound(); //No such flight found, no deletion was performed
            }
            var location = await _context.First_location.ToListAsync();
            _context.First_location.Remove(location.Where(a => a.Flight_id.CompareTo(id) == 0).First());

            var segmentsList = await _context.Segments.ToListAsync();
            var segments = segmentsList.Where(a => a.Flight_id.CompareTo(id) == 0).ToList();
            foreach (Segment element in segments) //Loop&remove segments
            {
                _context.Segments.Remove(element);
            }

            _context.FlightPlan.Remove(flight); //Remove the flight
            await _context.SaveChangesAsync();

            return null;
        }

    }
}
