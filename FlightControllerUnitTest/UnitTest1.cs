using FlightControlWeb;
using FlightControlWeb.Controllers;
using FlightControlWeb.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using System.Linq;
using System.Threading.Tasks;

namespace FlightControllerUnitTest
{
    [TestClass]
    public class FlightControllerUnitTest
    {
        private readonly FlightPlanContext flightPlanContext;
        private readonly FlightPlanController testedCotroller;
        
        //Tester constructor
        public FlightControllerUnitTest()
        {
            string[] args = { };
            var builder = new DbContextOptionsBuilder<FlightPlanContext>();
            var host = Program.CreateHostBuilder(args);
            builder.UseInMemoryDatabase("DataBase");
            flightPlanContext = new FlightPlanContext(builder.Options);
            testedCotroller = new FlightPlanController(flightPlanContext);
        }


        [TestMethod]
        public async Task GetFlightPlanExpectedTrue()
        {
            // Arrange
            Location location = new Location();
            location.flight_id = "Ag123456";
            var insertedFlight = new FlightPlan
            {
                flight_id = "Ag123456",
                passengers = 101,
                company_name = "AmitGuy",
                initial_location = location
            };
            
            // Act
            flightPlanContext.FlightPlan.Add(insertedFlight);
            flightPlanContext.SaveChanges();
            var flightPlan = await flightPlanContext.FlightPlan.FindAsync("Ag123456");
            Task<ActionResult<FlightPlan>> existingFlightPlanReturned = testedCotroller.GetFlightPlan("Ag123456");

            // Assert
            Assert.IsNotNull(existingFlightPlanReturned);
            Assert.IsTrue("Ag123456" == flightPlan.flight_id);
            Assert.IsTrue("Ag123456" == flightPlan.initial_location.flight_id);
            Assert.IsTrue("AmitGuy" == flightPlan.company_name);
            Assert.IsTrue(101 == flightPlan.passengers);

        }
        [TestMethod]
        [DataRow("Ga123456")]
        [DataRow("St1234567")]
        [DataRow("")]

        public async Task GetFlightPlanExpectedFalse(string id)
        {
            // Act
            ActionResult<FlightPlan> notExistingFlightPlanReturned = await testedCotroller.GetFlightPlan(id);
            string result = notExistingFlightPlanReturned.Result.ToString();

            // Assert
            Assert.IsTrue(result.Contains("NotFound"));
        }

        [TestMethod]

        public async Task PostFlightPlan()
        {
            // Arrange
            var flightPlan = new FlightPlan
            {
                flight_id = "Ag123456",
                passengers = 101,
                company_name = "AmitGuy",
                initial_location = new Location()
            };

            // Act
            Task<ActionResult<FlightPlan>> postedFlight = testedCotroller.PostFlightPlan(flightPlan);
            var flightPlans = await flightPlanContext.FlightPlan.ToListAsync();
            FlightPlan resultFlight = flightPlans.Where(a => a.flight_id.CompareTo(flightPlan.flight_id) == 0).First();

            // Assert
            Assert.IsNotNull(resultFlight);
            Assert.IsTrue(resultFlight.company_name.CompareTo(flightPlan.company_name) == 0);
            Assert.IsTrue(resultFlight.passengers==flightPlan.passengers);
        }
    }
}
