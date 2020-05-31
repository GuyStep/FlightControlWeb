function uploadOnDragOver() {
    document.getElementById("dropArea").style.display = "inline";
}

function uploadOnDragLeave() {
    document.getElementById("dropArea").style.display = "none";
}

function uploadOnDrop() {
    document.getElementById("dropArea").style.display = "none";
    setTimeout(readJSON, 100);
}

function readJSON() {
    let inputFile = document.getElementById("myFlightsInput").files[0];
    let reader = new FileReader();
    let jdata;
    reader.onload = function () {
        jdata = reader.result.replace('/r', '');
        let parsedJSON;
        try {
            parsedJSON = JSON.parse(jdata);
        } catch (e) {
            showError("File is not a valid JSON");
            return;
        }

        if (!validCompanyName(parsedJSON.company_name)) {
            return;
        }
        
        if (parsedJSON.initial_location != null) {
            if (!validInitialLocation(parsedJSON.initial_location)) {
                return;
            }
        }
        else {
            showError("Missing initial location");
            return;
        }

        if (parsedJSON.passengers != null) {
            if (!(Number.isInteger(parsedJSON.passengers) && parsedJSON.passengers >= 0)) {

                showError("passengers is not valid");
                return;
            }           
        }
        else {
            showError("Missing passengers");
            return;
        }

        if (parsedJSON.segments != null) {
            if (!validSegments(parsedJSON.segments)) {
                return;
            }
        }
        else {
            showError("Missing segments");
            return;
        }

        postData(jdata);
    }
    reader.readAsText(inputFile);
}

function validCompanyName(company_name) {
    if (company_name != null) {
        if (!(typeof company_name === 'string')) {
            showError("Company name is not valid");
            return false;
        }
    }
    else {
        showError("Missing company name");
        return false;
    }
    return true;
}

function validInitialLocation(initial_location) {
    if (initial_location.date_time != null) {
        let convertedDate = new Date(initial_location.date_time);
        if (isNaN(convertedDate)) {
            showError("Date-time is not valid");
            return false;
        }
    }
    else {
        showError("Missing date time");
        return false;

    }
    if (initial_location.longitude != null) {
        if (initial_location.longitude > 180 || initial_location.longitude < -180) {
            showError("longitude is not valid");
            return false;
        }
    }
    else {
        showError("Missing longitude");
        return false;

    }

    if (initial_location.latitude != null) {
        if (initial_location.latitude > 90 || initial_location.latitude < -90) {
            showError("latitude is not valid");
            return false;
        }
    }
    else {
        showError("Missing latitude");
        return false;

    }
    return true;
}

function validSegments(segments) {
    let isValid = true;
    segments.forEach(function (segment) {
        isValid = checkSingleSegment(segment);
        
    })

    return isValid;
}

function checkSingleSegment(segment) {
    if (segment.timespan_seconds != null) {
        if (!(Number.isInteger(segment.timespan_seconds) && (segment.timespan_seconds >= 0))) {
            showError("timespan seconds is not valid");
            return false;
        }
    }
    else {
        showError("Missing timespan seconds");
        return false;

    }

    if (segment.longitude != null) {
        if (segment.longitude > 180 || segment.longitude < -180) {
            showError("segment longitude is not valid");
            return false;
        }
    }
    else {
        showError("Missing segment longitude");
        return false;

    }

    if (segment.latitude != null) {
        if (segment.latitude > 90 || segment.latitude < -90) {
            showError("segment latitude is not valid");
            return false;
        }
    }
    else {
        showError("Missing segment latitude");
        return false;
    }
    return true;
}


function postData(jdata) {
    let request = new XMLHttpRequest();
    request.open("POST", "/api/FlightPlan", true);
    request.setRequestHeader("Content-Type", "application/json");
    request.send(jdata);
}