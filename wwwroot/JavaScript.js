let previousMarkedAirplane = null
let previousMarkedRow = null
const path = [null, null]
const markersDictionary = new Map()
const externalFlightsDictionary = new Map()
const pathsDictionary = new Map()
const segmentsDictionary = new Map()
let removeButtonClicked = false // Flag
let map

// Define icon for the selected airplane
const selectedAirplaneIcon = L.icon({
  iconUrl: '/Images/planeIconSelected.png',
  iconSize: [50, 50],
  iconAnchor: [25, 25]
})

// Define icon for the not selected airplane
const unselectedAirplaneIcon = L.icon({
  iconUrl: '/Images/planeIcon.png',
  iconSize: [50, 50],
  iconAnchor: [25, 25]
})

$(document).ready(function () {
  map = createMap()
  map.on('click', function () {
    map.removeLayer(path[0])
    removeFlightDetails()
    if (previousMarkedRow) {
      previousMarkedRow.classList.remove('bg-primary') // Unmark the marked row
    }

    map.eachLayer(function (layer) {
      if (layer instanceof L.Marker) {
        layer.setIcon(unselectedAirplaneIcon)
      }
    })
  })
  getFlights(map)
})

// Request the flights from the server in a loop with 1 second interval
function getFlights (map) {
  setInterval(function () {
    var date = new Date().toISOString()
    const url = '/api/Flights?relative_to=' + date + '&syncAll=true'
    $.ajax({
      type: 'GET',
      url: url,
      dataType: 'json',
      success: function (receivedData) {
        handleFlights(receivedData, map, markersDictionary, pathsDictionary, unselectedAirplaneIcon)
      },
      error: function () {
        showError('Get or Server error')
      }
    })
  }, 1000)
}

// Function creates an error message that is shown to the user
function showError (errorMessage = 'Error') {
  if (document.getElementById('errorMessage')) { // error is already shown
    return
  }
  const parentDiv = document.getElementById('buttonsDiv')
  console.log('Error: ' + errorMessage)

  // Create an error div
  const errorDiv = document.createElement('div')
  errorDiv.setAttribute('id', 'errorMessage')
  errorDiv.setAttribute('style', 'color:red; width: 400px; height: 26px; background-color:beige; border-radius: 5px; text-align:center; margin-left:200px')
  errorDiv.innerHTML = 'Error: ' + errorMessage

  // Add it to the HTML
  parentDiv.appendChild(errorDiv)

  // Allow removing the error bby clicking on it
  errorDiv.addEventListener('click', function () {
    parentDiv.removeChild(errorDiv)
  })
  setTimeout(function () {
    parentDiv.removeChild(errorDiv)
  }, 5000) // 1000ms = 1 second
}

async function getFlightByID (flightId) {
  const receivedData = await fetch('/api/FlightPlan/' + flightId)
  const flightData = await receivedData.json()
  createPath(flightData, pathsDictionary, flightId)
  createSegmentsList(flightData, flightId)
  return flightData
}

function handleFlights (receivedData, map, markersDictionary, pathsDictionary, markerIcon) {
  validateExternalFlights(receivedData) // Check if all the external flights we hold are still relevant
  receivedData.forEach(function (airplane, i) { // Loop over all the flights received from server
    if (!pathsDictionary.has(airplane.flight_id)) { // Create path and segments
      getFlightByID(airplane.flight_id)
    }
    const currentLocation = calculateLocation(airplane)
    if (markersDictionary.has(airplane.flight_id)) { // Check if the flight exists in dictionary
      const flightMarker = markersDictionary.get(airplane.flight_id)
      flightMarker.setLatLng(currentLocation)
    } else { // Add a flight and it's icon to the dictionary
      if (airplane.is_external) {
        externalFlightsDictionary.set(airplane.flight_id, airplane)
      }
      const marker = L.marker(currentLocation, { icon: markerIcon }).addTo(map) // Create marker
        .openPopup().on('click', function (e) {
          clickOnAirplane(airplane, map, e)
        })
      marker.id = airplane.flight_id
      markersDictionary.set(airplane.flight_id, marker) // Add the marker for this flight
      addFlightToFlightsTable(airplane, map, markersDictionary)
    }
  })
}

function validateExternalFlights (receivedData) {
  // Validate existing external flights (compare to what received from server)
  externalFlightsDictionary.forEach(function (ourFlight) {
    var flightExists = false
    if (receivedData.length === 0) { // No flights received, remove flight
      removeExternalFlight(ourFlight)
    }
    receivedData.forEach(function (serverFlight) { // Check if flight we hold was received
      if (ourFlight.flight_id === serverFlight.flight_id) {
        flightExists = true
      }
    })
    if (!flightExists) {
      removeExternalFlight(ourFlight)
    }
  })
  markersDictionary.forEach(function (ourFlight) {
    var flightExists = false
    if (receivedData.length === 0) { // No flights received, remove flight
      removeFlight(ourFlight.id)
    }
    receivedData.forEach(function (receivedFlight) { // Check if flight we hold was received
      if (ourFlight.id === receivedFlight.flight_id) {
        flightExists = true
      }
    })
    if (!flightExists) {
      removeFlight(ourFlight.id)
    }
  })
}

function calculateLocation (airplane) {
  var date = new Date().toISOString()
  const curTime = new Date(date) // Current time
  const takeOffTime = new Date(airplane.date_time) // Airplane takeoff time
  var timeDifference = parseFloat(curTime - takeOffTime) / 1000 // How many seconds past since plane took off
  let sumCurrentSegmentSeconds = 0
  const currentSegments = segmentsDictionary.get(airplane.flight_id)
  for (let i = 0; i < currentSegments.length; i++) {
    const sumPreviousSegmentSeconds = sumCurrentSegmentSeconds
    sumCurrentSegmentSeconds += currentSegments[i].timespan_seconds
    const inSegmentDiffernce = timeDifference - sumPreviousSegmentSeconds
    const inSegmentDifferncePercent = inSegmentDiffernce / currentSegments[i].timespan_seconds
    if (sumCurrentSegmentSeconds >= timeDifference) {
      return calculateLocationInSegment(airplane, currentSegments, i, inSegmentDifferncePercent)
    }
  }
}

function calculateLocationInSegment (airplane, currentSegments, i, inSegmentDifferncePercent) {
  let startLat
  let startLong
  const finishLat = currentSegments[i].latitude
  const finishLong = currentSegments[i].longitude
  if (!i) {
    startLat = airplane.latitude
    startLong = airplane.longitude
  } else {
    startLat = currentSegments[i - 1].latitude
    startLong = currentSegments[i - 1].longitude
  }
  const currentLat = startLat + (finishLat - startLat) * inSegmentDifferncePercent
  const currentLong = startLong + (finishLong - startLong) * inSegmentDifferncePercent
  return [currentLat, currentLong]
}

function addFlightToFlightsTable (airplaneItem, map, markersDictionary) {
  let tableRef = document.getElementById('internalFlightsTable').getElementsByTagName('tbody')[0]
  if (airplaneItem.is_external) { // If external, recplace the table with external table
    tableRef = document.getElementById('externalFlightsTable').getElementsByTagName('tbody')[0]
  }
  // Create row
  const row = tableRef.insertRow()
  row.addEventListener('click', function (e) {
    clickOnFlightRow(airplaneItem, row, markersDictionary)
  })
  row.setAttribute('id', airplaneItem.flight_id.toString()) // Unique ID for the flight row
  row.insertCell(0).innerHTML = airplaneItem.flight_id
  row.insertCell(1).innerHTML = airplaneItem.company_name
  if (!airplaneItem.is_external) { // If it's external, no need for removal button
    const removalButton = document.createElement('INPUT')
    removalButton.setAttribute('type', 'image')
    removalButton.setAttribute('id', 'remBut' + airplaneItem.flight_id)
    removalButton.setAttribute('src', 'Images/trash.png')
    removalButton.setAttribute('style', 'width: 17px; height: 20px')
      removalButton.addEventListener('click', function () {
          removeFlight(airplaneItem.flight_id)
      removeButtonClicked = true
    })
    row.insertCell(2).appendChild(removalButton)
  }
}

function clickOnFlightRow (airplaneItem, row, markersDictionary) {
  // If it was clicked, no need to continue with regular procedure
  if (removeButtonClicked) {
    removeFlightDetails(airplaneItem)
    removeButtonClicked = false
    return
  }

  showFlightPlan(airplaneItem) // Details table
  showPath(airplaneItem.flight_id, map)
  selectFlightRow(row)
  const marker = markersDictionary.get(airplaneItem.flight_id)
  marker.setIcon(selectedAirplaneIcon)
  if (previousMarkedAirplane && previousMarkedAirplane.localeCompare(airplaneItem.flight_id)) {
    const prevMark = markersDictionary.get(previousMarkedAirplane)
    prevMark.setIcon(unselectedAirplaneIcon) // Deselect the previous plane icon
  }
  previousMarkedAirplane = airplaneItem.flight_id
}

function selectFlightRow (row) { // Marks the row was clicked (or matching plane was clicked)
  if (previousMarkedRow) {
    previousMarkedRow.classList.remove('bg-primary') // Unmark the previous row
  }
  row.classList.add('bg-primary') // Mark the new row
  previousMarkedRow = row
}

function showFlightPlan (item) { // Show details of marked flight in the bottom table
  document.getElementById('flightID').textContent = item.flight_id
  document.getElementById('Company_name').textContent = item.company_name
  document.getElementById('Latitude').textContent = item.latitude
  document.getElementById('Longitude').textContent = item.longitude
  document.getElementById('Passengers').textContent = item.passengers
  document.getElementById('Date_time').textContent = item.date_time
  document.getElementById('Is_external').textContent = item.is_external
}

function removeExternalFlight (flight) {
  removeFlightDetails(flight.flight_id)

  if (path[1] != null && flight.flight_id === path[1]) {
    map.removeLayer(path[0])// Remove the path if the flight is selected
    path[0] = null
  }
  pathsDictionary.delete(flight.flight_id) // Remove the path from the dictionary

  removeMarker(flight, map, markersDictionary)
  markersDictionary.delete(flight.flight_id)

  externalFlightsDictionary.delete(flight.flight_id)

  const row = document.getElementById(flight.flight_id) // Remove flight from flights table
  const parent = row.parentNode
  parent.removeChild(row)
}

function removeFlight (flightId) {
  // Remove flight table row
  var td = event.target.parentNode
    if (typeof td == 'undefined') {
      td = document.getElementById(flightId)
      td = td.parentNode
    }
    else {
      td = td.parentNode.parentNode
    }

    const tr = document.getElementById(flightId)
  td.removeChild(tr)
  // Remove the path
    if (flightId === path[1]) {
    map.removeLayer(path[0])
    path[0] = null
  }
    pathsDictionary.delete(flightId)
  // Remove marker
    removeMarker(flightId, map, markersDictionary)
    markersDictionary.delete(flightId)
  // Remove flight from server
  let url = '/api/Flights/'
    url = url.concat(flightId)
  $.ajax({
    type: 'DELETE',
    url: url,
    dataType: 'json',
    error: function () {
      showError('Deletion problem')
    }
  })
    removeFlightDetails(flightId)
}

function removeMarker (flightID, map, markersDictionary) {
    if (markersDictionary.has(flightID)) {
    for (const id of markersDictionary.keys()) {
        if (id.toString() === flightID) {
        const marker = markersDictionary.get(id)
        markersDictionary.delete(id)
        map.removeLayer(marker)
      }
    }
  }
}

function removeFlightDetails (receivedFlightId) {
  const element = document.getElementById('flightID')
  const flightId = element.textContent
  if (receivedFlightId == null || receivedFlightId === flightId) {
    document.getElementById('flightID').textContent = ''
    document.getElementById('Company_name').textContent = ''
    document.getElementById('Latitude').textContent = ''
    document.getElementById('Longitude').textContent = ''
    document.getElementById('Passengers').textContent = ''
    document.getElementById('Date_time').textContent = ''
    document.getElementById('Is_external').textContent = ''
  }
}

function clickOnAirplane (flight, map, event) {
  showFlightPlan(flight)
  showPath(flight.flight_id, map)
  var row = document.getElementById(flight.flight_id)
  selectFlightRow(row)

  map.eachLayer(function (layer) {
    if (layer instanceof L.Marker) {
      layer.setIcon(unselectedAirplaneIcon)
    }
  })
  var layer = event.target
  layer.setIcon(selectedAirplaneIcon)
  previousMarkedAirplane = layer.id
}

function createSegmentsList (airplane, flightId) {
  segmentsDictionary.set(flightId, airplane.segments)
}

function createMap () {
  const map = L.map('map').setView([51.505, -0.09], 3)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map)
  return map
}

function createPath (airplane, pathsDictionary, flightId) {
  const singleAirplanePathArray = []
  const initialLat = parseFloat(airplane.initial_location.latitude)
  const initialLon = parseFloat(airplane.initial_location.longitude)
  singleAirplanePathArray.push([initialLat, initialLon]) // Add initial location
  for (let i = 0; i < airplane.segments.length; i++) { // Add segments to path
    var lat = parseFloat(airplane.segments[i].latitude)
    var lon = parseFloat(airplane.segments[i].longitude)
    singleAirplanePathArray.push([lat, lon])
  }
  pathsDictionary.set(flightId, singleAirplanePathArray) // Add the path to the dictionary
}

function showPath (flightId, map) {
  const flightSegments = pathsDictionary.get(flightId)
  if (path[0]) {
    map.removeLayer(path[0])
  }
  path[0] = L.polyline(flightSegments)
  path[1] = flightId
  map.addLayer(path[0])
}
