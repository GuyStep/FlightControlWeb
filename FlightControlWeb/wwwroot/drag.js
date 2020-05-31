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