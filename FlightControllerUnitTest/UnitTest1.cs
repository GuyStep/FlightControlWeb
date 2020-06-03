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
            location.Flight_id = "Ag123456";
            var insertedFlight = new FlightPlan
            {
                Flight_id = "Ag123456",
                Passengers = 101,
                Company_name = "AmitGuy",
                Initial_location = location
            };
            
            // Act
            flightPlanContext.FlightPlan.Add(insertedFlight);
            flightPlanContext.SaveChanges();
            var flightPlans = await flightPlanContext.FlightPlan.ToListAsync();
            var flightPlan = flightPlans.Where(a => a.Passengers == 101).ToList();

            Task<ActionResult<FlightPlan>> existingFlightPlanReturned = testedCotroller.GetFlightPlan("Ag123456");

            // Assert
            Assert.IsNotNull(existingFlightPlanReturned);
            Assert.IsTrue("Ag123456" == existingFlightPlanReturned.Result.Value.Flight_id);
            Assert.IsTrue("Ag123456" == existingFlightPlanReturned.Result.Value.Initial_location.Flight_id);
            Assert.IsTrue("AmitGuy" == existingFlightPlanReturned.Result.Value.Company_name);
            Assert.IsTrue(101 == existingFlightPlanReturned.Result.Value.Passengers);

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
                Flight_id = "Ag123456",
                Passengers = 101,
                Company_name = "AmitGuy",
                Initial_location = new Location()
            };

            // Act
            Task<ActionResult<FlightPlan>> postedFlight = testedCotroller.PostFlightPlan(flightPlan);
            var flightPlans = await flightPlanContext.FlightPlan.ToListAsync();
            FlightPlan resultFlight = flightPlans.Where(a => a.Flight_id.CompareTo(flightPlan.Flight_id) == 0).First();

            // Assert
            Assert.IsNotNull(resultFlight);
            Assert.IsTrue(resultFlight.Company_name.CompareTo(flightPlan.Company_name) == 0);
            Assert.IsTrue(resultFlight.Passengers==flightPlan.Passengers);
        }
    }
}
