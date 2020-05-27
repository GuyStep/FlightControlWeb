using FlightControlWeb;
using FlightControlWeb.Controllers;
using FlightControlWeb.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using System.Threading.Tasks;

namespace FlightControllerUnitTest
{
    [TestClass]
    public class FlightControllerUnitTest
    {
        // _sut == system under test
        private readonly FlightPlanContext _FlightDBContextMock;
        private readonly FlightPlanController _sut;
        //Constructor
        public FlightControllerUnitTest()
        {
            string[] args = { };
            var d = new DbContextOptionsBuilder<FlightPlanContext>();
            var h = Program.CreateHostBuilder(args);
            d.UseInMemoryDatabase("DBName");
            _FlightDBContextMock = new FlightPlanContext(d.Options);
            _sut = new FlightPlanController(_FlightDBContextMock);
        }


        [TestMethod]
        public async Task GetFlightPlan_ShouldReturnFlightPlan_WhenFlightPlanExists()
        {
            Location location = new Location();
            location.flight_id = "Ag123456";

            var flightPlanDto = new FlightPlan
            {
                flight_id = "Ag123456",
                passengers = 101,
                company_name = "AmitGuy",
                initial_location = location
            };
            _FlightDBContextMock.FlightPlan.Add(flightPlanDto);
            _FlightDBContextMock.SaveChanges();

            var flightPlan = await _FlightDBContextMock.FlightPlan.FindAsync("Ag123456");
            Task<ActionResult<FlightPlan>> existingFlightPlanReturned = _sut.GetFlightPlan("Ag123456");
            
            Assert.IsNotNull(existingFlightPlanReturned);
 
            Assert.IsTrue("Ag123456" == flightPlan.flight_id);
            Assert.IsTrue("Ag123456" == flightPlan.initial_location.flight_id);
            Assert.IsTrue(101 == flightPlan.passengers);
            Assert.IsTrue("AmitGuy" == flightPlan.company_name);

        }
        [TestMethod]
        [DataRow("Ga123456")]
        [DataRow("St1234567")]

        public async Task GetFlightPlan_ShouldReturnNotFound_WhenFlightPlanNotExist(string id)
        {
             ActionResult<FlightPlan> notExistingFlightPlanReturned = await _sut.GetFlightPlan(id);
            string result = notExistingFlightPlanReturned.Result.ToString();
             Assert.IsTrue(result.Contains("NotFound"));
        }
    }
}
