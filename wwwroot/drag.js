// Change style when file is dragged over the area
function uploadOnDragOver () {
  document.getElementById('dragAndDropZone').style.display = 'inline'
}

// Change style when the file that is dragged leaves the area
function uploadOnDragLeave () {
  document.getElementById('dragAndDropZone').style.display = 'none'
}

// Change style when the file that is dropped in the area
function uploadOnDrop () {
  document.getElementById('dragAndDropZone').style.display = 'none'
  setTimeout(readJSON, 100)
}

// Read the file and check its validity
function readJSON () {
  const inputFile = document.getElementById('myFlightsInput').files[0]
  const reader = new FileReader()
  let jdata
  reader.onload = function () {
    jdata = reader.result.replace('/r', '')
    let parsedJSON
    try {
      parsedJSON = JSON.parse(jdata) // Check if the file is valid JSON
    } catch (e) {
      showError('File is not a valid JSON')
      return
    }

    // Check validity of each field
    if (!validCompanyName(parsedJSON.company_name)) {
      return
    }

    if (parsedJSON.initial_location != null) {
      if (!validInitialLocation(parsedJSON.initial_location)) {
        return
      }
    } else {
      showError('Missing initial location')
      return
    }

    if (parsedJSON.passengers != null) {
      if (!(Number.isInteger(parsedJSON.passengers) && parsedJSON.passengers >= 0)) {
        showError('passengers is not valid')
        return
      }
    } else {
      showError('Missing passengers')
      return
    }

    if (parsedJSON.segments != null) {
      if (!validSegments(parsedJSON.segments)) {
        return
      }
    } else {
      showError('Missing segments')
      return
    }

    postData(jdata)
  }
  reader.readAsText(inputFile)
}

function validCompanyName (companyName) {
  if (companyName != null) {
    if (!(typeof companyName === 'string')) {
      showError('Company name is not valid')
      return false
    }
  } else {
    showError('Missing company name')
    return false
  }
  return true
}

function validInitialLocation (initialLocation) {
  if (initialLocation.date_time != null) {
    const convertedDate = new Date(initialLocation.date_time)
    if (isNaN(convertedDate)) {
      showError('Date-time is not valid')
      return false
    }
  } else {
    showError('Missing date time')
    return false
  }
  if (initialLocation.longitude != null) {
    if (initialLocation.longitude > 180 || initialLocation.longitude < -180) {
      showError('longitude is not valid')
      return false
    }
  } else {
    showError('Missing longitude')
    return false
  }

  if (initialLocation.latitude != null) {
    if (initialLocation.latitude > 90 || initialLocation.latitude < -90) {
      showError('latitude is not valid')
      return false
    }
  } else {
    showError('Missing latitude')
    return false
  }
  return true
}

function validSegments (segments) {
  let isValid = true
  segments.forEach(function (segment) {
    isValid = checkSingleSegment(segment)
  })

  return isValid
}

function checkSingleSegment (segment) {
  if (segment.timespan_seconds != null) {
    if (!(Number.isInteger(segment.timespan_seconds) && (segment.timespan_seconds >= 0))) {
      showError('timespan seconds is not valid')
      return false
    }
  } else {
    showError('Missing timespan seconds')
    return false
  }

  if (segment.longitude != null) {
    if (segment.longitude > 180 || segment.longitude < -180) {
      showError('segment longitude is not valid')
      return false
    }
  } else {
    showError('Missing segment longitude')
    return false
  }

  if (segment.latitude != null) {
    if (segment.latitude > 90 || segment.latitude < -90) {
      showError('segment latitude is not valid')
      return false
    }
  } else {
    showError('Missing segment latitude')
    return false
  }
  return true
}

// Post the json file data
function postData (data) {
  const request = new XMLHttpRequest()
  request.open('POST', '/api/FlightPlan', true)
  request.setRequestHeader('Content-Type', 'application/json')
  request.send(data)
}
