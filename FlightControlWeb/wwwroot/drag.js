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
    let segmentsFail = false;
    reader.onload = function () {
        jdata = reader.result.replace('/r', '');
        let stringJSON, parsedJSON;
        let validFile = true;
        try {
            parsedJSON = JSON.parse(jdata);
            stringJSON = JSON.stringify(jdata);
        } catch (e) {
            showError("File is not a valid JSON");
            return;
        }
        //if (parsedJSON != null) {

            
        if (parsedJSON.company_name != null) {
            if (!(typeof parsedJSON.company_name === 'string')) {
                showError("Company name is not valid");
                return;
            }
        }
        else {
            showError("Missing company name");
            return;
        }
        if (parsedJSON.initial_location != null) {
            if (parsedJSON.initial_location.date_time != null) {
                let convertedDate = new Date(parsedJSON.initial_location.date_time);
                if (isNaN(convertedDate)) {
                    showError("Date-time is not valid");
                    return;
                }
            }
            else {
                showError("Missing date time");
                return;

            }
            if (parsedJSON.initial_location.longitude != null) {
                if (parsedJSON.initial_location.longitude > 180 || parsedJSON.initial_location.longitude < -180) {
                    showError("longitude is not valid");
                    return;
                }
            }
            else {
                showError("Missing longitude");
                return;

            }

            if (parsedJSON.initial_location.latitude != null) {
                if (parsedJSON.initial_location.latitude > 90 || parsedJSON.initial_location.latitude < -90) {
                    showError("latitude is not valid");
                    return;
                }
            }
            else {
                showError("Missing latitude");
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
            parsedJSON.segments.forEach(function (segment) {
                if (segment.timespan_seconds != null) {
                    if (!(Number.isInteger(segment.timespan_seconds) && (segment.timespan_seconds >= 0))) {
                        showError("timespan seconds is not valid");
                        segmentsFail = true;
                        return;
                    }
                }
                else {
                    showError("Missing timespan seconds");
                    segmentsFail = true;
                    return;

                }
                if (segment.longitude != null) {
                    if (segment.longitude > 180 || segment.longitude < -180) {
                        showError("segment longitude is not valid");
                        segmentsFail = true;
                        return;
                    }
                }
                else {
                    showError("Missing segment longitude");
                    segmentsFail = true;
                    return;

                }

                if (segment.latitude != null) {
                    if (segment.latitude > 90 || segment.latitude < -90) {
                        showError("segment latitude is not valid");
                        segmentsFail = true;
                        return;
                    }
                }
                else {
                    showError("Missing segment latitude");
                    segmentsFail = true;
                    return;
                } 
            })
        }
        else {
            showError("Missing segments");
            return;
        }

        if (segmentsFail) {
            return;
        }
        postData(jdata);
    }
    reader.readAsText(inputFile);
}

function postData(jdata) {
    let request = new XMLHttpRequest();
    request.open("POST", "/api/FlightPlan", true);
    request.setRequestHeader("Content-Type", "application/json");
    request.send(jdata);
}