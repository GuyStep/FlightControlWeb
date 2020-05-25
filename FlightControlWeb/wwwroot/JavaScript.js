let previousMarkedAirplane = null;
let previousMarkedRow = null;
let polyline;
let path = [];
let group = L.layerGroup();
const pathsDictionary = new Map();
let markedMarkerIcon = L.icon({
    iconUrl: '/Images/planeIconSelected.png',
    iconSize: [50, 50], // size of the icon
    iconAnchor: [50, 50], // point of the icon which will correspond to marker's location
    popupAnchor: [-3, -76] // point from which the popup should open relative to the iconAnchor
});
let map;

let markerIcon = L.icon({
    iconUrl: '/Images/planeIcon.png',
    iconSize: [50, 50], // size of the icon
    iconAnchor: [50, 50], // point of the icon which will correspond to marker's location
    popupAnchor: [-3, -76] // point from which the popup should open relative to the iconAnchor
});

$(document).ready(function () {
    map = createMap();
    //group.addTo(map);
    //var polylinePoints = [
    //    [37.781814, -122.404740],
    //    [37.781719, -122.404637],
    //    [37.781489, -122.404949],
    //    [37.780704, -122.403945],
    //    [37.780012, -122.404827]
    //];
    //var path1 = L.polyline(polylinePoints).addTo(map);
    map.on('click', function () {
        map.removeLayer(path[0]);
        removeFlightDetails()

        //switch all markers icons' to non-marked icon
        map.eachLayer(function (layer) {
            if (layer instanceof L.Marker) {
                layer.setIcon(markerIcon);
            }
        });
    });
    getFlightsFromServer(map, polyline);
})

function getFlightsFromServer(map, polyline) {
    const planesDictionary = new Map();
    setInterval(function () {
        var date = new Date().toISOString();
        //console.log(date);
        let url = "/api/Flights?relative_to=" + date + "&syncAll=true";
        $.ajax({
            type: "GET",
            url: url,
            dataType: 'json',
            success: function (jdata) {
                handleFlights(jdata, map, planesDictionary, pathsDictionary, markerIcon, polyline);
            },
            error: errorCallback
        });
    }, 1000);
}

function handleFlights(jdata, map, planesDictionary, pathsDictionary, markerIcon, polyline) {
    jdata.forEach(function (airplane, i) {

        if (!pathsDictionary.has(airplane.flight_id)) {
            let currentFlight = getFlightPlanByItem(airplane.flight_id);
            
        }

        let lat = parseFloat(airplane.latitude);
        let long = parseFloat(airplane.longitude);
        if (planesDictionary.has(airplane.flight_id)) { //Check if the flight exists in dictionary
            let flightMarker = planesDictionary.get(airplane.flight_id);
            flightMarker.setLatLng([lat, long]);
        } else { //Add a flight and it's icon to the dictionary
            let marker = L.marker([lat, long], { icon: markerIcon }).addTo(map)
                .openPopup().on('click', function (e) {
                    clickOnAirplane(airplane, map, polyline, e);
                }); 
            marker.id = airplane.flight_id;
            planesDictionary.set(airplane.flight_id, marker);
            addFlightToFlightsTable(airplane, map, planesDictionary);
        }
        
        //the flight has been terminated/not started.
        //else {
        //    //search if the filght has been terminated and delete it from the table and the map.
        //    //if the flight is still on the map, delete it.
        //    if (planes.has(item.flight_id)) {
        //        endOfFlight(item, map, planes);
        //    }
        //}
    });


}

function errorCallback() {
    alert("Error");
}

function addFlightToFlightsTable(airplaneItem, map, planesDictionary) {
    let tableRef = document.getElementById("myFlightsTable").getElementsByTagName('tbody')[0];


    let row = tableRef.insertRow();
    row.setAttribute("id", "row" + airplaneItem.flightId);

    let removalButton = document.createElement("INPUT");
    removalButton.setAttribute("type", "image");
    removalButton.setAttribute("id", "remBut" + airplaneItem.flight_id);
    removalButton.setAttribute("src", "Images/trash.png");
    removalButton.setAttribute("style", "width: 17px; height: 20px");
        
    row.addEventListener("click", function (e) {
        //let eleID = e.target.id
        //let notRemoveClicked = eleID === "remBut" + airplaneItem.flight_id;
        //let notRemoveClicked = elementType.compareLocale("image")
        //if (!notRemoveClicked) {
            clickOnFlightRow(airplaneItem, row, planesDictionary);
        //}
    });
    row.setAttribute("id", airplaneItem.flight_id.toString());
    row.insertCell(0).innerHTML = airplaneItem.flight_id;
    row.insertCell(1).innerHTML = airplaneItem.company_name;
    removalButton.addEventListener("click", function () {
        removeFlight(airplaneItem, map, planesDictionary);
    });
    row.insertCell(2).appendChild(removalButton);
}

function clickOnFlightRow(airplaneItem, row, planesDictionary) {
    showFlightPlan(airplaneItem);
    showPath(airplaneItem.flight_id, map);
    markRow(row);
    let marker = planesDictionary.get(airplaneItem.flight_id);
    marker.setIcon(markedMarkerIcon);
    if (previousMarkedAirplane && previousMarkedAirplane.localeCompare(airplaneItem.flight_id)) {
        let prevMark = planesDictionary.get(previousMarkedAirplane)
        prevMark.setIcon(markerIcon);
    }
    previousMarkedAirplane = airplaneItem.flight_id;
}

function markRow(row) { //Marks the row was clicked (or matching plane was clicked)
    row.classList.add("bg-primary"); //Mark the new row
    if (previousMarkedRow) {
        previousMarkedRow.classList.remove("bg-primary"); //Unmark the previous row
    }
    previousMarkedRow = row; 
}

function showFlightPlan(item) { //Show details of marked flight in the bottom table
    let td = document.getElementById("flight_details");
    let tr = td.rows[0];
    tr.id = item.flight_id;
    document.getElementById("flightID").textContent = item.flight_id;
    document.getElementById("Company_name").textContent = item.company_name;
    document.getElementById("Latitude").textContent = item.latitude;
    document.getElementById("Longitude").textContent = item.longitude;
    document.getElementById("Passengers").textContent = item.passengers;
    document.getElementById("Date_time").textContent = item.date_time;
    document.getElementById("Is_external").textContent = item.is_external;
}

function removeFlight(airplaneItem, map, planesDictionary) {
    // event.target will be the input element.
    let td = event.target.parentNode;
    let tr = td.parentNode; // the row to be removed
    td.parentNode.parentNode.removeChild(tr);
    if (airplaneItem.flight_id === path[1]) {
        map.removeLayer(path[0]);
    }
    //delete filght details if it was presed
    removeFlightDetails(airplaneItem.flight_id);


    if (airplaneItem.flight_id === path[1]) {
        map.removeLayer(path[0]);
        path[0] = null;
        pathsDictionary.delete(airplaneItem.flight_id);
    }


    //delete the marker from the map.
    deleteMarker(airplaneItem, map, planesDictionary);

    //let trId = tr.id;
    //delete flight from database if its a local flight.

    if (!airplaneItem.is_external) {
        let url = "/api/Flights/"
        url = url.concat(airplaneItem.flight_id);
        $.ajax({
            type: "DELETE",
            url: url,
            dataType: 'json',
            error: function () {
                alert("problemm delete");
            }
        });
    }



    //let row = document.getElementById(previousMarkedAirplane.flight_id);
    ////.getElementsByTagName('tbody')[0]

    //flightsRowOnClick(previousMarkedAirplane, row, planesDictionary);


}

//get a flight and delete it from the markers(planes) list if its there.
function deleteMarker(item, map, planes) {
    if (planes.has(item.flight_id))
        for (const k of planes.keys()) {
            if (k.toString() === item.flight_id) {
                let marker = planes.get(k);
                planes.delete(k);
                map.removeLayer(marker);
            }
        }
}

function removeEndedFlight(item, map, planes) {
    // event.target will be the input element.
    let td = event.target.parentNode;
    let tr = td.parentNode; // the row to be removed
    tr.parentNode.removeChild(tr);
    //delete the marker from the map.
    deleteMarker(item, map, planes);

    //delete filght details if it was presed
    removeFlightDetails();
}
//if the flight details was shown
function removeFlightDetails(flight_id) {
    let flightId = document.getElementById("flightID").textContent;
    if (flight_id === flightId) {
        document.getElementById("flightID").textContent = " ";
        document.getElementById("Company_name").textContent = " ";
        document.getElementById("Latitude").textContent = " ";
        document.getElementById("Longitude").textContent = " ";
        document.getElementById("Passengers").textContent = " ";
        document.getElementById("Date_time").textContent = " ";
        document.getElementById("Is_external").textContent = " ";
        //group.clearLayers();

    }
}


function clickOnAirplane(item, map, polyline, e) {
    showFlightPlan(item);
    showPath(item.flight_id, map);
    var tds = document.querySelectorAll('#myFlightsTable tbody tr'), i;
    //delete mark from other rows in myFlightsTable
    let row;
    for (i = 0; i < tds.length; ++i) {
        if (tds[i].id === item.flight_id) {
            row = tds[i];
        }
    }
    tds = document.querySelectorAll('#externalFlightsTable tbody tr'), i;
    for (i = 0; i < tds.length; ++i) {
        if (tds[i].id === item.flight_id) {
            row = tds[i];
        }
    }
    markRow(row);

    //switch all markers icons' to non-marked icon
    map.eachLayer(function (layer) {
        if (layer instanceof L.Marker) {
            layer.setIcon(markerIcon);
        }
    });
    //mark current marker with marked-icon
    var layer = e.target;
    layer.setIcon(markedMarkerIcon);
    previousMarkedAirplane = layer.id;
    //getFlightPlanByItem(item);
}



async function getFlightPlanByItem(item) {
    let url = "/api/FlightPlans/" + item;
    let jdata = await fetch(url);
    let airplaneData = await jdata.json();
    console.log(airplaneData);
    createPath(airplaneData, map, pathsDictionary, polyline);
    return airplaneData;
}

//function createPolyline(jdata, map, polyline) {
//    let segments = jdata.segments;
//    let longitude;
//    let latitude;
//    let location
//    let polylineArray = [];
//    for (let i = 0; i < segments.length; i++) {
//        longitude = segments[i]["longitude"];
//        latitude = segments[i]["latitude"];
//        location = [latitude, longitude];
//        polylineArray.push(location);
//    }
//    group.clearLayers();
//    polyline = L.polyline(polylineArray, { color: 'red' }).addTo(group);
//}

function createMap() {
    let map = L.map('map').setView([51.505, -0.09], 3);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    return map;
}

function createPath(airplane, map, pathsDictionary, polyline) {

    //jdata.forEach(function (airplane) { //Loop over all the flights from server
    let singleAirplanePathArray = []
    let lat = parseFloat(airplane.latitude);
    let long = parseFloat(airplane.longitude);
    singleAirplanePathArray.push([lat, long]); //Add start location
    for (let i = 0; i < airplane.segments.length; i++) {
    //airplane.segments.forEach(function (segment) { //Loop over the segments and add them to array
        singleAirplanePathArray.push([parseFloat(airplane.segments[i].latitude), parseFloat(airplane.segments[i].longitude)]);
    }
    pathsDictionary.set(airplane.initial_location.flight_id, singleAirplanePathArray); //Add fligt:path to dictionary
    //});
}

function showPath(flight_id, map){
    //group.addTo(map);
    let flightSegments = pathsDictionary.get(flight_id);
    if (path[0]) {
        map.removeLayer(path[0]);
    }
    path[0] = L.polyline(flightSegments);
    path[1] = flight_id;
    map.addLayer(path[0]);
}

//1. Deletion of paths
//2. Removing from dectionaries after delete
//3. The EVENT bug(flight details and path)

//4. Plane Position
//5. Servers
//6. Tests
//7. Ip windoow
//8. Servers Window
