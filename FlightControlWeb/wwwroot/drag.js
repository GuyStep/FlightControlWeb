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
        let validFile = true;
        try {
            JSON.parse(jdata);
            parsedJSON = JSON.stringify(jdata);
        } catch (e) {
            showError("File is not a valid JSON");
            return;
        }
        if (parsedJSON != null) {


            if (!parsedJSON.includes("company_name")) {
                validFile = false;
                showError("Missing company name");
            }
            if (!parsedJSON.includes("date_time")) {
                validFile = false;
                showError("Missing date time");
            }
            if (!parsedJSON.includes("longitude")) {
                validFile = false;
                showError("Missing longitude");
            }
            if (!parsedJSON.includes("latitude")) {
                validFile = false;
                showError("Missing latitude");
            }
            if (!parsedJSON.includes("segments")) {
                validFile = false;
                showError("Missing segments");
            }
            if (!parsedJSON.includes("timespan_seconds")) {
                validFile = false;
                showError("Missing timespan seconds");
            }
            if (!validFile) {
                return;
            }
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