﻿let previousMarkedAirplane = null;
let previousMarkedRow = null;
let polyline;
let path = [null, null];
let group = L.layerGroup();
const markersDictionary = new Map();
const externalFlightsDictionary = new Map();
const pathsDictionary = new Map();
const segmentsDictionary = new Map();
let removeButtonClicked = false;
let markedMarkerIcon = L.icon({
    iconUrl: '/Images/planeIconSelected.png',
    iconSize: [50, 50], // size of the icon
    iconAnchor: [25,25], // point of the icon which will correspond to marker's location
    popupAnchor: [-3, -76] // point from which the popup should open relative to the iconAnchor
});
let map;


let markerIcon = L.icon({
    iconUrl: '/Images/planeIcon.png',
    iconSize: [50, 50], // size of the icon
    iconAnchor: [25, 25], // point of the icon which will correspond to marker's location
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
        if (previousMarkedRow) {
            previousMarkedRow.classList.remove("bg-primary"); //Unmark the marked row
        }


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
    
    setInterval(function () {
        var date = new Date().toISOString();
        //console.log(date);
        let url = "/api/Flights?relative_to=" + date + "&syncAll=true";
        $.ajax({
            type: "GET",
            url: url,
            dataType: 'json',
            success: function (jdata) {
                handleFlights(jdata, map, markersDictionary, pathsDictionary, markerIcon, polyline);
            },
            error: errorCallback
        });
    }, 1000);
}

async function getFlightPlanByItem(flight_id) {
    let url = "/api/FlightPlan/" + flight_id;
    let jdata = await fetch(url);
    let airplaneData = await jdata.json();
    //console.log(airplaneData);
    createPath(airplaneData, map, pathsDictionary, polyline, flight_id);
    createSegmentsList(airplaneData, flight_id);
    return airplaneData;
}

function handleFlights(jdata, map, markersDictionary, pathsDictionary, markerIcon, polyline) {
    externalFlightsDictionary.forEach(function (ourFlight, flight_id) {
        var flightExists = false;
        if (jdata.length == 0) {
            removeExternalFlight(ourFlight);
        }
        jdata.forEach(function (serverFlight) {
            if (ourFlight.flight_id === serverFlight.flight_id) {
                flightExists = true;
            }

        });  
        if (!flightExists) {
            removeExternalFlight(ourFlight);
        }
    });


    jdata.forEach(function (airplane, i) {


        if (!pathsDictionary.has(airplane.flight_id)) { //Create path and segments
            let currentFlight = getFlightPlanByItem(airplane.flight_id);

        }

        let currentLocation = calculateLocation(airplane);
        //let lat = parseFloat(airplane.latitude);
        //let long = parseFloat(airplane.longitude);
        if (markersDictionary.has(airplane.flight_id)) { //Check if the flight exists in dictionary
            let flightMarker = markersDictionary.get(airplane.flight_id);
            flightMarker.setLatLng(currentLocation);
        } else { //Add a flight and it's icon to the dictionary
            if (airplane.is_external) {
                externalFlightsDictionary.set(airplane.flight_id, airplane);
            }
            let marker = L.marker(currentLocation, { icon: markerIcon }).addTo(map)
                .openPopup().on('click', function (e) {
                    clickOnAirplane(airplane, map, polyline, e);
                }); 
            marker.id = airplane.flight_id;
            markersDictionary.set(airplane.flight_id, marker);
            addFlightToFlightsTable(airplane, map, markersDictionary);
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

function calculateLocation(airplane) {
    var date = new Date().toISOString();
    let date1 = new Date(date); 
    let date2 = new Date(airplane.date_time);
    var difference = parseFloat(date1 - date2)/1000; //How many seconds past since plane took off
    let sumCurrentSegmentSeconds = 0;
    let currentSegments = segmentsDictionary.get(airplane.flight_id);

    for (let i = 0; i < currentSegments.length; i++){
        let sumPreviousSegmentSeconds = sumCurrentSegmentSeconds;
        sumCurrentSegmentSeconds += currentSegments[i].timespan_seconds;
        let inSegmentDiffernce = difference - sumPreviousSegmentSeconds;
        let inSegmentDifferncePercent = inSegmentDiffernce / currentSegments[i].timespan_seconds;
        if (sumCurrentSegmentSeconds >= difference) {
            let startLat;
            let startLong; 
            let finishLat = currentSegments[i].latitude;
            let finishLong = currentSegments[i].longitude;
            if (!i) {
                startLat = airplane.latitude;
                startLong = airplane.longitude;
            }
            else {
                startLat = currentSegments[i-1].latitude;
                startLong = currentSegments[i-1].longitude;
            }
            let currentLat = startLat + (finishLat - startLat) * inSegmentDifferncePercent;
            let currentLong = startLong + (finishLong - startLong) * inSegmentDifferncePercent;
            return [currentLat, currentLong];
        }
    }
}

function errorCallback() {
    alert("Error");
}

function addFlightToFlightsTable(airplaneItem, map, markersDictionary) {
    let tableRef = document.getElementById("myFlightsTable").getElementsByTagName('tbody')[0];
    if (airplaneItem.is_external) {
        tableRef = document.getElementById("externalFlightsTable").getElementsByTagName('tbody')[0];
    }

    let row = tableRef.insertRow();
    row.setAttribute("id", "row" + airplaneItem.flightId);


        
    row.addEventListener("click", function (e) {
        //let eleID = e.target.id
        //let notRemoveClicked = eleID === "remBut" + airplaneItem.flight_id;
        //let notRemoveClicked = elementType.compareLocale("image")
        //if (!notRemoveClicked) {
            clickOnFlightRow(airplaneItem, row, markersDictionary);
        //}
    });
    row.setAttribute("id", airplaneItem.flight_id.toString());
    row.insertCell(0).innerHTML = airplaneItem.flight_id;
    row.insertCell(1).innerHTML = airplaneItem.company_name;
    if (!airplaneItem.is_external) {
        let removalButton = document.createElement("INPUT");
        removalButton.setAttribute("type", "image");
        removalButton.setAttribute("id", "remBut" + airplaneItem.flight_id);
        removalButton.setAttribute("src", "Images/trash.png");
        removalButton.setAttribute("style", "width: 17px; height: 20px");
        removalButton.addEventListener("click", function () {
            removeFlight(airplaneItem, map, markersDictionary);
            removeButtonClicked = true;
        });
        row.insertCell(2).appendChild(removalButton);

    }
}

function clickOnFlightRow(airplaneItem, row, markersDictionary) {
    if (removeButtonClicked) {
        removeFlightDetails(airplaneItem);
        removeButtonClicked = false;
        return;
    }

    showFlightPlan(airplaneItem);
    showPath(airplaneItem.flight_id, map);
    markRow(row);
    let marker = markersDictionary.get(airplaneItem.flight_id);
    marker.setIcon(markedMarkerIcon);
    if (previousMarkedAirplane && previousMarkedAirplane.localeCompare(airplaneItem.flight_id)) {
        let prevMark = markersDictionary.get(previousMarkedAirplane)
        prevMark.setIcon(markerIcon);
    }
    previousMarkedAirplane = airplaneItem.flight_id;
}

function markRow(row) { //Marks the row was clicked (or matching plane was clicked)
    if (previousMarkedRow) {
        previousMarkedRow.classList.remove("bg-primary"); //Unmark the previous row
    }
    row.classList.add("bg-primary"); //Mark the new row
    previousMarkedRow = row; 
}


function showFlightPlan(item) { //Show details of marked flight in the bottom table
    let td = document.getElementById("flight_details");
    let tr = td.rows[0];
    //tr.id = item.flight_id;
    document.getElementById("flightID").textContent = item.flight_id;
    document.getElementById("Company_name").textContent = item.company_name;
    document.getElementById("Latitude").textContent = item.latitude;
    document.getElementById("Longitude").textContent = item.longitude;
    document.getElementById("Passengers").textContent = item.passengers;
    document.getElementById("Date_time").textContent = item.date_time;
    document.getElementById("Is_external").textContent = item.is_external;
}

function removeExternalFlight(flight) {
    removeFlightDetails(flight.flight_id);


    if (path[1] != null && flight.flight_id === path[1]) {
        map.removeLayer(path[0]);
        path[0] = null;
    }
    pathsDictionary.delete(flight.flight_id);

    deleteMarker(flight, map, markersDictionary);
    markersDictionary.delete(flight.flight_id);

    externalFlightsDictionary.delete(flight.flight_id);

    let row = document.getElementById(flight.flight_id);
    //let tr = row.parentNode; // the row to be removed
    let parent = row.parentNode;
    parent.removeChild(row);

}


function removeFlight(airplaneItem, map, markersDictionary) {
    // event.target will be the input element.
    let td = event.target.parentNode;
    let tr = td.parentNode; // the row to be removed
    td.parentNode.parentNode.removeChild(tr);
    if (airplaneItem.flight_id === path[1]) {
        map.removeLayer(path[0]);
    }
    //delete filght details if it was presed


    if (airplaneItem.flight_id === path[1]) {
        map.removeLayer(path[0]);
        path[0] = null;
        pathsDictionary.delete(airplaneItem.flight_id);
    }


    //delete the marker from the map.
    deleteMarker(airplaneItem, map, markersDictionary);
    markersDictionary.delete(airplaneItem.flight_id);

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


    removeFlightDetails(airplaneItem.flight_id);

    //let row = document.getElementById(previousMarkedAirplane.flight_id);
    ////.getElementsByTagName('tbody')[0]
    //flightsRowOnClick(previousMarkedAirplane, row, markersDictionary);
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
    let element = document.getElementById("flightID");
    let flightId = element.textContent;
    if (flight_id == null || flight_id === flightId) {
        document.getElementById("flightID").textContent = " ";
        document.getElementById("Company_name").textContent = " ";
        document.getElementById("Latitude").textContent = " ";
        document.getElementById("Longitude").textContent = " ";
        document.getElementById("Passengers").textContent = " ";
        document.getElementById("Date_time").textContent = " ";
        document.getElementById("Is_external").textContent = " ";
        group.clearLayers();

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

function createSegmentsList(airplane, flight_id) {
    segmentsDictionary.set(flight_id, airplane.segments);
}

function createMap() {
    let map = L.map('map').setView([51.505, -0.09], 3);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    return map;
}

function createPath(airplane, map, pathsDictionary, polyline, flight_id) {

    //jdata.forEach(function (airplane) { //Loop over all the flights from server
    let singleAirplanePathArray = []
    let lat = parseFloat(airplane.initial_location.latitude);
    let long = parseFloat(airplane.initial_location.longitude);
    singleAirplanePathArray.push([lat, long]); //Add start location
    for (let i = 0; i < airplane.segments.length; i++) {
    //airplane.segments.forEach(function (segment) { //Loop over the segments and add them to array
        singleAirplanePathArray.push([parseFloat(airplane.segments[i].latitude), parseFloat(airplane.segments[i].longitude)]);
    }
    //});
    pathsDictionary.set(flight_id, singleAirplanePathArray);
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


//3. The EVENT bug(flight details and path)
//4. Path and details are not deleted when flight is deleted
//5. Rotate icon & resize icon for zoom
//6. Tests
//7. Ip windoow
//8. Servers Window
//9. Raise errors
