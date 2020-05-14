
function g() {
    let listFlight = [["123", "323", "432"],["123", "323", "432"]];
    let row = document.createElement("tr");
    let td = document.createElement("td");
    $.ajax({
        type: "GET",
        url: "/api/Flights",
        dataType: 'json',
        success: successsCallback,
        error: errorCallback
    });
}
function successsCallback(jData) {
    let table = document.getElementById("flightTable");
    //alert(jData[0].flight_id);
    alert("Guy");
    alert(jData);
    jData.forEach(function (item, i) {
        let row = document.createElement("tr");
        let td1 = document.createElement("td");
        let td2 = document.createElement("td");
        let td3 = document.createElement("td");
        td1.innerHTML = item.flight_id;
        td2.innerHTML = item.longitude;
        td3.innerHTML = item.latitude;
        row.appendChild(td1);
        row.appendChild(td2);
        row.appendChild(td3);
        table.appendChild(row);

    });
}
function errorCallback(jData) {
    alert("error");
}
$(document).ready(function () {
    g();
});