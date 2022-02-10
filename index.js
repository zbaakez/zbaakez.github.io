let actualStopsSessions;
let actualStops = [];
let interval = null;

let departureOrArrivalTime = true; //true means departure time, false means arrival time
let routeType = 0; // 0 -> least time, 1 -> leastInterchange, 2->leastWalking
window.onload = function () {
  //abfahrtenInput
  //wait for user to stopy typing for 250 seconds (library for 2 lines of code)
  $('#startInput').keyup(_.debounce(startInputEvent, 300));
  $('#endInput').keyup(_.debounce(endInputEvent, 300));
  $('#abfahrtenInput').keyup(_.debounce(abfahrtenInputEvent, 300));
  document.getElementById("selectAbfahrtszeit").style.background = "green";
  document.getElementById("selectAbfahrtszeit").style.borderColor = "green";
  document.getElementById("selectAnkunftszeit").style.background = "lightgrey";
  document.getElementById("selectAnkunftszeit").style.borderColor = "lightgrey";
  let date = new Date()
  let time = date.toLocaleTimeString().split(":");
  let srcInput = "";
  let destInput = "";
  let holeTrip = [];
  let urlSud = "";
  time.pop();
  document.getElementById('datePick').value = date.toISOString().split('T')[0];
  document.getElementById('timePick').value = time.join(":");
  document.getElementById("moveBtn").addEventListener("click", transistPage);
  setAutocompleteListeners();
  setInterval(x, 1000);
  actualStopsSessions = sessionStorage.getItem("stopSession");
  if (actualStopsSessions !== null) {
    if (actualStopsSessions.split("#")[0] !== null) {

      let save = actualStopsSessions.split("#");
      for (let i = 0; i < save.length; i++) {
        if (!actualStops.includes(save[i]) && save[i] !== null)
          actualStops.push(save[i]);
      }
    }
  }

  if (actualStops[0] === "null")
    actualStops.shift();
};

function x() {
  var d = new Date();
  var s = d.getSeconds();
  var m = d.getMinutes();
  var h = d.getHours();
  document.getElementById("spanTime").textContent = ("0" + h).substr(-2) + ":" + ("0" + m).substr(-2) + ":" + ("0" + s).substr(-2);
}


function startInputEvent() {
  getStops(document.getElementById("startInput").value);
}
function endInputEvent() {
  getStops(document.getElementById("endInput").value);
}
function abfahrtenInputEvent() {
  getStops(document.getElementById("abfahrtenInput").value);
}




function transistPage() {

  $("#about-2").toggle("slide", { direction: "right" }, 500);
  $("#about-1").toggle("slide", { direction: "left" }, 500);
  if (document.getElementById("moveBtn").textContent.includes("Abfahrten")) {
    document.getElementById("moveBtn").innerHTML = "<h5>Zu Verbindungen<h5>"
  } else {
    document.getElementById("moveBtn").innerHTML = "<h5>Zu Abfahrten</h5>"
  }
}


async function getStops(text, { signal } = {}) {
  if (text.length > 2) {
    let el1 = document.getElementById('startInput');
    let el2 = document.getElementById('endInput');
    let el3 = document.getElementById('abfahrtenInput');

    if (document.activeElement === el1) {
      el1.classList.add("loading")
      el1.type = "text";
    }
    else if (document.activeElement === el2) {
      el2.classList.add("loading")
      el2.type = "text";
    }
    else if (document.activeElement === el3) {
      el3.classList.add("loading")
      el3.type = "text";
    }


    text = text.split(" ").join("%20");
    let urlStops = 'https://efa.sta.bz.it/apb/XML_STOPFINDER_REQUEST?locationServerActive=1&outputFormat=JSON&type_sf=any&name_sf=' + text;
    try {
      fetch(urlStops).then(response => response.json()).then(data => { handleStops(data); }).catch(function () {
        return;
      });;
    } catch (e) {
      return;
    }
  }
  return;
}

async function handleStops(data) {
  let el1 = document.getElementById('startInput');
  let el2 = document.getElementById('endInput');
  let el3 = document.getElementById('abfahrtenInput');
  if (data["stopFinder"]["points"]) {
    if (data["stopFinder"]["points"]["point"] !== undefined) { //other structure
      if (!actualStops.includes(data["stopFinder"]["points"]["point"]["name"]))
        actualStops.push(data["stopFinder"]["points"]["point"]["name"]);
      //Bozen gibt komische Daten
      //https://efa.sta.bz.it/apb/XML_STOPFINDER_REQUEST?locationServerActive=1&outputFormat=JSON&type_sf=any&name_sf=Bozen
      if (data["stopFinder"]["points"]["point"]["name"] === "Bozen, Bahnhof Bozen") {
        //add Bozen Süd, Kaiserau, ...
        if (!actualStops.includes("Bozen, Bahnhof Bozen Süd"))
          actualStops.push("Bozen, Bahnhof Bozen Süd");
        if (!actualStops.includes("Bozen, Bahnhof Bozen Kaiserau"))
          actualStops.push("Bozen, Bahnhof Bozen Kaiserau");
        if (!actualStops.includes("Bozen, Lama Bozen"))
          actualStops.push("Bozen, Lama Bozen");
      }
    }
    else if (data["stopFinder"]["points"].length > 0) {
      for (let i = 0; i < data["stopFinder"]["points"].length; i++) {
        if (!actualStops.includes(data["stopFinder"]["points"][i]["name"]) && data["stopFinder"]["points"][i]["anyType"] === "stop")
          actualStops.push(data["stopFinder"]["points"][i]["name"]);
      }
    }
    //force new search on fields
    if (document.activeElement === el1)
      $("#startInput").autocomplete("search", document.getElementById("startInput").value);
    else if (document.activeElement === el2)
      $("#endInput").autocomplete("search", document.getElementById("endInput").value);
    else if (document.activeElement === el3)
      $("#abfahrtenInput").autocomplete("search", document.getElementById("abfahrtenInput").value);

  }
  el1.classList.remove("loading")
  el2.classList.remove("loading")
  el3.classList.remove("loading")
  el1.type = "search";
  el2.type = "search";
  el3.type = "search";
}

function setAutocompleteListeners() {
  $("#startInput").autocomplete({
    source: actualStops,
    maxResults: 10,
    minLength: 2,
    delay: 300,
    source: function (request, response) {
      var results = $.ui.autocomplete.filter(actualStops, request.term);
      response(results.slice(0, this.options.maxResults));
    },
    messages: {
      noResults: '',
      results: function () { }
    }
  });
  $("#endInput").autocomplete({
    maxResults: 10,
    minLength: 2,
    delay: 300,
    source: function (request, response) {
      var results = $.ui.autocomplete.filter(actualStops, request.term);
      response(results.slice(0, this.options.maxResults));
    },
    messages: {
      noResults: '',
      results: function () { }
    }
  });
  $("#abfahrtenInput").autocomplete({
    maxResults: 10,
    minLength: 2,
    delay: 300,
    source: function (request, response) {
      var results = $.ui.autocomplete.filter(actualStops, request.term);
      response(results.slice(0, this.options.maxResults));
    },
    messages: {
      noResults: '',
      results: function () { }
    },
    select: function (event, ui) {
      if (interval !== null)
        clearInterval(interval);

      document.getElementById("spinner3").hidden = false;
      getDepartures(ui.item.label)
      interval = setInterval(function () {
        getDepartures(ui.item.label);
      }, 30 * 1000);

    }

  });


}


function searchConnection() {
  let el1 = document.getElementById('startInput');
  let el2 = document.getElementById('endInput');
  let el3 = document.getElementById('abfahrtenInput');
  el1.classList.remove("loading")
  el2.classList.remove("loading")
  el3.classList.remove("loading")
  el1.type = "search";
  el2.type = "search";
  el3.type = "search";
  document.getElementById("outputRoutes").removeAttribute("style");
  document.getElementById("searchButton").disabled = true;
  document.getElementById("spinner").hidden = false;
  document.getElementById("outputRoutes").innerHTML = "";
  //abort search for new stops to save performance
  const ac = new AbortController();
  getStops({ signal: ac.signal });
  ac.abort(); // cancel the update

  srcInput = document.getElementById("startInput").value;
  destInput = document.getElementById("endInput").value;

  get2PointConnection(srcInput, destInput);

}

function selectDepartOrArrivalTime(value) {

  let bt1 = document.getElementById("selectAbfahrtszeit");
  let bt2 = document.getElementById("selectAnkunftszeit");
  departureOrArrivalTime = value;
  if (value) {
    bt1.style.background = "green";
    bt1.style.borderColor = "green";
    bt2.style.background = "lightgrey";
    bt2.style.borderColor = "lightgrey";
  } else {
    bt2.style.background = "green";
    bt2.style.borderColor = "green";
    bt1.style.background = "lightgrey";
    bt1.style.borderColor = "lightgrey";
  }


}


function radioClicked(radioNr) {
  if (radioNr === 1) {
    document.getElementById("radioLabel1").innerHTML = "<h6>schnellste</h6>";
    document.getElementById("radioLabel2").innerHTML = "wenig Umstiege";
    document.getElementById("radioLabel3").innerHTML = "kurze Fußwege";
  } else if (radioNr === 2) {
    document.getElementById("radioLabel2").innerHTML = "<h6>wenig Umstiege</h6>";
    document.getElementById("radioLabel1").innerHTML = "schnellste";
    document.getElementById("radioLabel3").innerHTML = "kurze Fußwege";
  } else {
    document.getElementById("radioLabel3").innerHTML = "<h6>kurze Fußwege</h6>";
    document.getElementById("radioLabel1").innerHTML = "schnellste";
    document.getElementById("radioLabel2").innerHTML = "wenig Umstiege";

  }
}



async function get2PointConnection(src, dest) {

  let srcString = src.split(" ").join("%20");
  let destString = dest.split(" ").join("%20");
  let startTime = document.getElementById("timePick").value.split(":").join(""); //&itdTime=HHMM&
  let startDate = document.getElementById("datePick").value.split("-").join(""); //&itdDate=JJJJMMTT&
  let maxMinutesOnFoot = 15; //weiß parameter nicht
  // let via = document.getElementById("zwischenhaltInput").value.split(" ").join("%20"); //evtl Zwischenhalestelle einbauen &itdOdv=Haltestelle
  let maxChanges = 9; //
  let arrOrDepTimeString = "itdTripDateTimeDepArr=dep" //
  if (!departureOrArrivalTime)
    arrOrDepTimeString = "itdTripDateTimeDepArr=arr"

  let howManyTrips = 5;

  let routeTypeString = "&routeType=LEASTTIME";
  if (document.getElementById('radioUmstiege').checked)
    routeTypeString = "&routeType=LEASTINTERCHANGE";
  else if (document.getElementById('radioFusswege').checked)
    routeTypeString = "&routeType=LEASTWALKING";

  //TODO
  //maximalen fußweg einbauen...15min...parameter?
  //evtl verkehrsmittel excluden &excludedMeans=1,2,3&
  urlSud = 'https://efa.sta.bz.it/apb/XML_TRIP_REQUEST2?locationServerActive=1&stateless=%201&type_origin=any&name_origin=' + srcString + '&type_destination=any&name_destination=' + destString + '&' + arrOrDepTimeString + '&itdTime=' + startTime + '&itdDate=' + startDate + '&calcNumberOfTrips=' + howManyTrips + '&maxChanges=' + maxChanges + routeTypeString + '&useProxFootSearch=1&coordOutputFormatTail=4&outputFormat=JSON&coordOutputFormat=WGS84[DD.DDDDD]';
  $.getJSON(urlSud, function (data) {
    // JSON result in `data` variable

    holeTrip = [];
    if (data["trips"]) {

      for (let i = 0; i < data["trips"].length; i++) {
        holeTrip[i] = new HoleTrip(data["trips"][i]);
        holeTrip[i].findTrips();
      }

      buildFrontend(holeTrip);

    } else {
      //Wenn wegen falscher eingabe oder anderen fehlern keine Routen gefunden werden
      console.error("Error! No route found!")
      document.getElementById("spinner").hidden = true;
      document.getElementById("searchButton").disabled = false;
      document.getElementById("outputRoutes").innerHTML = "Keine Verbindung gefunden!"
      document.getElementById("outputRoutes").style.color = "red"
    }

  })
    .fail(function () {
      console.error("Error! No route found!")
      document.getElementById("spinner").hidden = true;
      document.getElementById("searchButton").disabled = false;
      document.getElementById("outputRoutes").innerHTML = "Keine Verbindung gefunden!"
      document.getElementById("outputRoutes").style.color = "red"
    })

}

async function findTempByCoordOrName(longitude, latitude, stationName, src) { //src === true if srcstation, else deststation
  //get temperature of nearest point
  const openWeather = await fetch('https://api.openweathermap.org/data/2.5/weather?lat=' + latitude + '&lon=' + longitude + '&appid=dc704448494ba8187b5e3cf65aafac7f&units=metric');
  const openWeatherData = await openWeather.json();
  let desc = openWeatherData["weather"][0]["description"];
  let urlAdd = "";
  if (desc == "clear sky") {
    urlAdd = "Klarer Himmel";

  } else if (desc == "few clouds") {
    urlAdd = "Wenige Wolken";
  }
  else if (desc == "scattered clouds") {
    urlAdd = "Wolken";
  }
  else if (desc == "broken clouds") {
    urlAdd = "Wolken";
  }
  else if (desc == "shower clouds") {
    urlAdd = "Regenwolken";
  }
  else if (desc == "rain") {
    urlAdd = "Regen";
  }
  else if (desc == "thunderstorm") {
    urlAdd = "Gewitter";
  }
  else if (desc == "snow") {
    urlAdd = "Schneefall";
  }
  else if (desc == "mist") {
    urlAdd = "Nebelig";
  }

  let nearestPoint = -1;
  const weather = await fetch('http://daten.buergernetz.bz.it/services/weather/station?categoryId=1&lang=de&format=json');
  const weatherData = await weather.json();
  let tempLongitude, tempLatitude, minDifference, difference;

  //first search if a name can be found on weatherdata
  stationName = stationName.replace("%20", " ");
  let stationNames = stationName.split(" ");
  if (stationNames.includes("Lana") || stationNames.includes("Lana,"))
    stationNames.push("Gargazon")

  for (let i = 0; i < weatherData["rows"].length; i++) {
    for (let x = 0; x < stationNames.length; x++) {
      if (weatherData["rows"][i]["name"].includes(stationNames[x].replace(/[^a-zA-Z]+/g, '')) && stationNames[x].replace(/[^a-zA-Z]+/g, '').length > 3) {
        nearestPoint = i;
      }
    }
  }

  if (nearestPoint < 0) {
    for (let s = 0; s < weatherData["rows"].length; s++) {
      tempLongitude = Number(weatherData["rows"][s]["longitude"].replace(",", "."));
      tempLatitude = Number(weatherData["rows"][s]["latitude"].replace(",", "."));
      difference = Math.abs((tempLongitude + tempLatitude) - (latitude + longitude));
      if (s === 0) {
        minDifference = difference;
        nearestPoint = 0;
      } else if ((difference < minDifference && difference > 0)) {
        minDifference = difference;
        nearestPoint = s;
      }
    }
  }
  let value = [];
  value.push(weatherData["rows"][nearestPoint]["t"]);
  value.push(urlAdd)
  return value;
}

function padTo2Digits(num) {
  return num.toString().padStart(2, '0');
}

async function buildFrontend(holeTrip) {

  let code = "";

  //Frontend zusammenbauen
  let srcTemp1 = await findTempByCoordOrName(Number(holeTrip[0].subTrip[0].srcStationLongitude), Number(holeTrip[0].subTrip[0].srcStationLatitude), srcInput, true);
  let destTemp1 = await findTempByCoordOrName(Number(holeTrip[0].subTrip[0].EndStationLongitude), Number(holeTrip[0].subTrip[0].EndStationLatitude), destInput, false);
  
  let d1 = new Date();
  let today = (padTo2Digits(d1.getDate())) + "." +(padTo2Digits(d1.getMonth()+1)) + "."+d1.getFullYear();

  for (let i = 0; i < holeTrip.length; i++) {

    if (i === 0) {
      code += '<div><h5>Temperatur am Startort: ' + srcTemp1[0] + ' °C  -  ' + srcTemp1[1] + '</h5><h5>Temperatur am Ankunftsort: ' + destTemp1[0] + ' °C  -  ' + destTemp1[1] + '</h5></div>';
      code += "<br>";
    }
    else {
      code = "<br>";
    }
    code += '<div class="accordion">\n';
    code += '<h2 class="accordion-item" id="headingRoute' + i + '">\n';
    code += '<button class="accordion-button collapsed" type="button" data-bs-toggle="collapse"\n';
    code += ' data-bs-target="#collapseRoute' + i + '" aria-expanded="false" aria-controls="collapseRoute' + i + '">\n';
    let transfers = [];


    code += "<div class=\"transferListOutput\">"
    let next = "";

    for (let x = 0; x < holeTrip[i].subTrip.length; x++) {
      if (x < holeTrip[i].subTrip.length - 1)
        next = ">";
      else
        next = "";

      if (holeTrip[i].subTrip[x].typeOfVehicle === "5" || holeTrip[i].subTrip[x].typeOfVehicle === "6" || holeTrip[i].subTrip[x].typeOfVehicle === "7") { //bus
        code += '<div class="busTransferOutput"> ' + holeTrip[i].subTrip[x].numberOfTransfer + '</div>'
      }
      else if (holeTrip[i].subTrip[x].typeOfVehicle === "0") { // zug
        if (holeTrip[i].subTrip[x].nameOfTransfer.includes("V"))
          code += '<div class="trainTransferOutput">RV</div>'
        else
          code += '<div class="trainTransferOutput">R</div>'
      }
      else if (holeTrip[i].subTrip[x].typeOfVehicle === "8") { // Seilbahn
        code += '<div class="seilbahnTransferOutput"> S' + next + '</div>'
      }
      else {
        if (holeTrip[i].subTrip[x].nameOfTransfer === "") { //zufuß
          code += '<div class="walkTransferOutput">&#128694;</div>'
        }
        else { // anderes Mittel
          code += '<div class="otherTransferOutput">A ' + holeTrip[i].subTrip[x].numberOfTransfer + '</div>'
        }
      }
      if (next === ">")
        code += '<div class="nextOut"> > </div>';
    }

    code += "</div>"
    
    
    let date = ""
    if(holeTrip[i].subTrip[0].startDate != today)
      date = ", "+holeTrip[i].subTrip[0].startDate+"";

    if (holeTrip[i].subTrip.length > 1) {
      
      code += '' + holeTrip[i].holeDuration + ' Std, ' + holeTrip[i].subTrip[0].rtStartTime + ' - ' + holeTrip[i].subTrip[holeTrip[i].subTrip.length - 1].rtArrivalTime + ', Von: ' + holeTrip[i].subTrip[0].srcStation + ''+date+'</h5>\n';
    } else {
      code += '' + holeTrip[i].holeDuration + ' Std, ' + holeTrip[i].subTrip[0].rtStartTime + ' - ' + holeTrip[i].subTrip[0].rtArrivalTime + ', Von: ' + holeTrip[i].subTrip[0].srcStation + ''+date+'</h5>\n';
    }
    code += '</button>\n</h2>';
    code += '<div id="collapseRoute' + i + '" class="accordion-collapse collapse">\n';
    code += '<div class="accordion-body border rounded">\n';


    for (let x = 0; x < holeTrip[i].subTrip.length; x++) {

      if (x !== 0) {
        code += '<div class="umstieg_output">&#128694; ' + holeTrip[i].subTrip[x - 1].expectedTransferTime + ' min, ' + holeTrip[i].subTrip[x - 1].timeToTransferinMinutes + ' min Umstiegszeit</div>';
      }

      code += '<div class="accordion accordion-flush" id="' + i + 'bodySub' + x + '">'
      code += '<div class="accordion-item">'
      code += '<h2 class="accordion-header border rounded" id="' + i + 'bodyHeader' + x + '">'
      code += '<button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse' + i + 'Body' + x + '" aria-expanded="false" aria-controls="collapse' + i + 'Body' + x + '">'

      if (holeTrip[i].subTrip[x].typeOfVehicle === "5" || holeTrip[i].subTrip[x].typeOfVehicle === "6" || holeTrip[i].subTrip[x].typeOfVehicle === "7") { //bus
        if (holeTrip[i].subTrip[x].trainPlatformStart != "")
          code += '<div class="busTransferOutput border rounded" style = "margin-right: 10px">' + holeTrip[i].subTrip[x].nameOfTransfer + '</div> ' + holeTrip[i].subTrip[x].rtStartTime + '-' + holeTrip[i].subTrip[x].rtArrivalTime + ', Von: ' + holeTrip[i].subTrip[x].srcStation + ', Plattform: ' + holeTrip[i].subTrip[x].trainPlatformStart + ', Nach: ' + holeTrip[i].subTrip[x].destStation + ', Endstation: ' + holeTrip[i].subTrip[x].lastDesination + '</button> </h2>';
        else
          code += '<div class="busTransferOutput border rounded" style = "margin-right: 10px">' + holeTrip[i].subTrip[x].nameOfTransfer + '</div> ' + holeTrip[i].subTrip[x].rtStartTime + '-' + holeTrip[i].subTrip[x].rtArrivalTime + ', Von: ' + holeTrip[i].subTrip[x].srcStation + ', Nach: ' + holeTrip[i].subTrip[x].destStation + ', Endstation: ' + holeTrip[i].subTrip[x].lastDesination + '</button> </h2>';

      }
      else if (holeTrip[i].subTrip[x].typeOfVehicle === "0") { // zug
        if (holeTrip[i].subTrip[x].trainPlatformStart != "")
          code += '<div class="trainTransferOutput border rounded" style = "margin-right: 10px">' + holeTrip[i].subTrip[x].nameOfTransfer + '</div> ' + holeTrip[i].subTrip[x].rtStartTime + '-' + holeTrip[i].subTrip[x].rtArrivalTime + ', Von: ' + holeTrip[i].subTrip[x].srcStation + ', Gleis: ' + holeTrip[i].subTrip[x].trainPlatformStart + ', Nach: ' + holeTrip[i].subTrip[x].destStation + ', Endstation: ' + holeTrip[i].subTrip[x].lastDesination + '</button> </h2>';
        else
          code += '<div class="trainTransferOutput border rounded" style = "margin-right: 10px">' + holeTrip[i].subTrip[x].nameOfTransfer + '</div> ' + holeTrip[i].subTrip[x].rtStartTime + '-' + holeTrip[i].subTrip[x].rtArrivalTime + ', Von: ' + holeTrip[i].subTrip[x].srcStation + ', Nach: ' + holeTrip[i].subTrip[x].destStation + ', Endstation: ' + holeTrip[i].subTrip[x].lastDesination + '</button> </h2>';

      }
      else if (holeTrip[i].subTrip[x].typeOfVehicle === "8") { // Seilbahn
        if (holeTrip[i].subTrip[x].trainPlatformStart != "")
          code += '<div class="seilbahnTransferOutput border rounded" style = "margin-right: 10px">Seilbahn ' + holeTrip[i].subTrip[x].nameOfTransfer + '</div> ' + holeTrip[i].subTrip[x].rtStartTime + '-' + holeTrip[i].subTrip[x].rtArrivalTime + ', Von: ' + holeTrip[i].subTrip[x].srcStation + ', Plattform: ' + holeTrip[i].subTrip[x].trainPlatformStart + ', Nach: ' + holeTrip[i].subTrip[x].destStation + ', Endstation: ' + holeTrip[i].subTrip[x].lastDesination + '</button> </h2>';
        else
          code += '<div class="seilbahnTransferOutput border rounded" style = "margin-right: 10px">Seilbahn ' + holeTrip[i].subTrip[x].nameOfTransfer + '</div> ' + holeTrip[i].subTrip[x].rtStartTime + '-' + holeTrip[i].subTrip[x].rtArrivalTime + ', Von: ' + holeTrip[i].subTrip[x].srcStation + ', Nach: ' + holeTrip[i].subTrip[x].destStation + ', Endstation: ' + holeTrip[i].subTrip[x].lastDesination + '</button> </h2>';

      }
      else {
        if (holeTrip[i].subTrip[x].nameOfTransfer === "") { //zufuß
          if (holeTrip[i].subTrip[x].trainPlatformStart != "")
            code += '<div class="walkTransferOutput border rounded" style = "margin-right: 10px">Fußweg</div> ' + holeTrip[i].subTrip[x].rtStartTime + '-' + holeTrip[i].subTrip[x].rtArrivalTime + ', Von: ' + holeTrip[i].subTrip[x].srcStation + ', Plattform: ' + holeTrip[i].subTrip[x].trainPlatformStart + ', Nach: ' + holeTrip[i].subTrip[x].destStation + '</button> </h2>';
          else
            code += '<div class="walkTransferOutput border rounded" style = "margin-right: 10px">Fußweg</div> ' + holeTrip[i].subTrip[x].rtStartTime + '-' + holeTrip[i].subTrip[x].rtArrivalTime + ', Von: ' + holeTrip[i].subTrip[x].srcStation + ', Nach: ' + holeTrip[i].subTrip[x].destStation + '</button> </h2>';
        }
        else { // anderes Mittel
          if (holeTrip[i].subTrip[x].trainPlatformStart != "")
            code += '<div class="otherTransferOutput border rounded" style = "margin-right: 10px">Andere - ' + holeTrip[i].subTrip[x].nameOfTransfer + '</div>, ' + holeTrip[i].subTrip[x].rtStartTime + '-' + holeTrip[i].subTrip[x].rtArrivalTime + ', Von: ' + holeTrip[i].subTrip[x].srcStation + ', Plattform: ' + holeTrip[i].subTrip[x].trainPlatformStart + ', Nach: ' + holeTrip[i].subTrip[x].destStation + ', Endstation: ' + holeTrip[i].subTrip[x].lastDesination + '</button> </h2>';
          else
            code += '<div class="otherTransferOutput border rounded" style = "margin-right: 10px">Andere - ' + holeTrip[i].subTrip[x].nameOfTransfer + '</div>, ' + holeTrip[i].subTrip[x].rtStartTime + '-' + holeTrip[i].subTrip[x].rtArrivalTime + ', Von: ' + holeTrip[i].subTrip[x].srcStation + ', Nach: ' + holeTrip[i].subTrip[x].destStation + ', Endstation: ' + holeTrip[i].subTrip[x].lastDesination + '</button> </h2>';
        }
      }


      code += '<div id="collapse' + i + 'Body' + x + '" class="accordion-collapse collapse" aria-labelledby="flush-headingOne" data-bs-parent="#collapse' + i + 'Body' + x + '">'
      code += '<br><div class="stopsOutput border rounded"><div class="finalStops">Dauer: ' + holeTrip[i].subTrip[x].duration + ' Min, Zwischenhalte: ' + (holeTrip[i].subTrip[x].stops.length - 2) + '<br>';

      for (let j = 0; j < holeTrip[i].subTrip[x].stops.length; j++) {

        if (holeTrip[i].subTrip[x].arrTimes[j] !== undefined) {

          if (holeTrip[i].subTrip[x].arrTimes[j].length < 7) {
            code += '<br>' + holeTrip[i].subTrip[x].stops[j] + " " + holeTrip[i].subTrip[x].arrTimes[j] + ' ';
          }
          else {
            code += '<br>' + holeTrip[i].subTrip[x].stops[j] + " " + holeTrip[i].subTrip[x].arrTimes[j].split(" ")[1] + ' ';
          }
        }

      }

      code += "</div></div></div></div></div>";
      code += "<br>";
    }

    code += ' </div>\n';
    code += ' </div>\n';

    document.getElementById("outputRoutes").innerHTML += code;
    code = "";
  }
  document.getElementById("outputRoutes").innerHTML += code += '<div class="d-flex justify-content-center"><div hidden="true"  id ="spinner2" class="spinner-border" style="width: 2.5rem; height: 2.5rem; color: #348AC7;" role="status"><span class="sr-only"></span> </div></div>';
  sessionStorage.setItem('stopSession', actualStopsSessions + "#" + srcInput + "#" + destInput);
  document.getElementById("outputRoutes").innerHTML += '<button onclick="searchMore()" id="searchMore" class="btn-dark-blue btn-rounded">Weitere Routen suchen!</button>';
  document.getElementById("spinner").hidden = true;
  document.getElementById("spinner2").hidden = true;
  document.getElementById("searchMore").disabled = false;
  document.getElementById("searchButton").disabled = false;
}


function searchMore() {
  document.getElementById("spinner2").hidden = false;
  document.getElementById("searchMore").disabled = true;

  let lastTime = holeTrip[holeTrip.length - 1]["subTrip"][0]["startTime"].split(":");
  const Date1 = new Date(holeTrip[holeTrip.length - 1]["subTrip"][0]["startDate"].split(".")[2], holeTrip[holeTrip.length - 1]["subTrip"][0]["startDate"].split(".")[1] - 1, holeTrip[holeTrip.length - 1]["subTrip"][0]["startDate"].split(".")[0], lastTime[0], lastTime[1]);
  Date1.setTime(Date1.getTime() + 1000 * 60); // add 1 minute

  let minute = Date1.getMinutes();
  let hour = Date1.getHours();
  if (minute < 10)
    minute = "0" + minute;
  if (hour < 10)
    hour = "0" + hour;

  let month = Date1.getMonth() + 1;
  let date = Date1.getDate();
  let year = Date1.getFullYear();
  if (month < 10)
    month = "0" + month;
  if (date < 10)
    date = "0" + date;
  date = year + "" + month + "" + date;

  // change this &itdTime=2231&itdDate=20220207&calcNumberOfTrips=5
  // to this &itdDate=20220207&calcNumberOfTrips=2&calcOneDirection=1
  let newUrl = urlSud;
  newUrl = newUrl.replace(/itdTime=[0-9]{1,}/g, 'itdTime=' + hour + '' + minute + '') //HHMM
  newUrl = newUrl.replace(/itdDate=[0-9]{1,}/g, 'itdDate=' + date + '') //YYYYMMDD
  newUrl = newUrl.replace(/calcNumberOfTrips=[0-9]{1,}/g, 'calcNumberOfTrips=2')
  newUrl += "&calcOneDirection=1";

  $.getJSON(newUrl, function (data) {
    // JSON result in `data` variable

    if (data["trips"]) {

      for (let i = 0; i < data["trips"].length; i++) {
        holeTrip[holeTrip.length] = new HoleTrip(data["trips"][i]);
        holeTrip[holeTrip.length - 1].findTrips();
      }
      document.getElementById("outputRoutes").innerHTML = "";
      buildFrontend(holeTrip);

    } else {
      //Wenn wegen falscher eingabe oder anderen fehlern keine Routen gefunden werden
      console.error("Error! No route found!")
      document.getElementById("spinner").hidden = true;
      document.getElementById("searchButton").disabled = false;
      document.getElementById("outputRoutes").innerHTML = "Ein Fehler ist aufgetreten!"
      document.getElementById("outputRoutes").style.color = "red"
    }

  }).fail(function() { console.error("Error! No route found!")
  document.getElementById("spinner").hidden = true;
  document.getElementById("searchButton").disabled = false;
  document.getElementById("outputRoutes").innerHTML = "Ein Fehler ist aufgetreten!"
  document.getElementById("outputRoutes").style.color = "red" })
  .always(function() { alert("complete"); });;

}

//should be upgraded to also respect dates
function hoursToMinutes(time) {
  time = time.split(":")
  time[0] = Number(time[0] * 60)
  time[1] = Number(time[1])
  return time[0] + time[1];
}

class HoleTrip {
  constructor(trip) {
    this.trip = trip;
    this.holeDuration = this.trip["duration"];
    this.subTrip = [];
  };

  async findTrips() {
    let interChanges = Number(this.trip["interchange"]);
    let duration, realArrivalTime, realStartTime, nameOfTransfer, numberOfTransfer, srcStation, destStation, lastDesination, startTime, arrivalTime, typeOfVehicle, startDate, arrivalDate, trainPlatformStart, trainPlatformEnd, timeOfNextBus, timeToTransfer, expectedTransferTime;
    let stops = [], allStopArrivalTimes = [], allStopDepTimes = [];
    let srclatitude = 0, srclongitude = 0, destlatitude = 0, destlongitude = 0;

    //save every thing of every interChange into a new SubTrip class
    for (let i = 0; i < interChanges + 1; i++) {

      duration = this.trip["legs"][i]["timeMinute"];
      numberOfTransfer = this.trip["legs"][i]["mode"]["number"];
      nameOfTransfer = this.trip["legs"][i]["mode"]["name"];
      srcStation = this.trip["legs"][i]["points"][0]["name"];
      destStation = this.trip["legs"][i]["points"][1]["name"];

      lastDesination = this.trip["legs"][i]["mode"]["destination"];
      startTime = this.trip["legs"][i]["points"][0]["dateTime"]["time"];
      arrivalTime = this.trip["legs"][i]["points"][1]["dateTime"]["time"];
      realStartTime = this.trip["legs"][i]["points"][0]["dateTime"]["rtTime"];
      realArrivalTime = this.trip["legs"][i]["points"][1]["dateTime"]["rtTime"];
      typeOfVehicle = this.trip["legs"][i]["mode"]["code"];
      startDate = this.trip["legs"][i]["points"][0]["dateTime"]["date"];
      arrivalDate = this.trip["legs"][i]["points"][1]["dateTime"]["date"];
      trainPlatformStart = this.trip["legs"][i]["points"][0]["platformName"];
      trainPlatformEnd = this.trip["legs"][i]["points"][1]["platformName"];

      srclongitude = this.trip["legs"][i]["points"][0]["ref"]["coords"].split(",")[0];
      srclatitude = this.trip["legs"][i]["points"][0]["ref"]["coords"].split(",")[1];
      destlongitude = this.trip["legs"][i]["points"][1]["ref"]["coords"].split(",")[0];
      destlatitude = this.trip["legs"][i]["points"][1]["ref"]["coords"].split(",")[1];

      stops = [];
      allStopDepTimes = [];
      allStopArrivalTimes = [];
      //find all stops on your way
      if (this.trip["legs"][i]["stopSeq"] != undefined) {
        for (let x = 0; x < this.trip["legs"][i]["stopSeq"].length; x++) {
          stops.push(this.trip["legs"][i]["stopSeq"][x]["name"]); //read all station names
          if (x > 0) {
            allStopDepTimes.push(this.trip["legs"][i]["stopSeq"][x]["depDateTime"]);
            allStopArrivalTimes.push(this.trip["legs"][i]["stopSeq"][x]["ref"]["arrDateTime"])
          } else {
            allStopArrivalTimes.push(realStartTime)
            allStopDepTimes.push(realStartTime)
          }

        }
      }

      if (this.trip["legs"][i + 1] !== undefined) {
        //time when next bus starts to calculate time for transfer
        timeOfNextBus = this.trip["legs"][i + 1]["points"][0]["dateTime"]["time"];
        //zeit zum umsteigen 
        timeToTransfer = hoursToMinutes(timeOfNextBus) - hoursToMinutes(arrivalTime);
        //expected transfer time
        if (this.trip["legs"][i]["footpath"] !== undefined)
          expectedTransferTime = this.trip["legs"][i]["footpath"][0]["duration"];
        else
          expectedTransferTime = 0;
      }
      this.subTrip[i] = new SubTrip(i, duration, realStartTime, srclatitude, srclongitude, destlatitude, destlongitude, realArrivalTime, allStopDepTimes, allStopArrivalTimes, nameOfTransfer, numberOfTransfer, srcStation, destStation, lastDesination,
        startTime, arrivalTime, typeOfVehicle, startDate, arrivalDate, trainPlatformStart,
        trainPlatformEnd, timeOfNextBus, timeToTransfer, expectedTransferTime, stops);

    }

  }

}


class SubTrip {
  //evtl busseite usw
  constructor(tripId, duration, rtStartTime, srclatitude, srclongitude, destLatitude, destLongitude, rtArrivalTime, allStopDepTimes, allStopArrivalTimes, nameOfTransfer, numberOfTransfer, srcStation, destStation, lastDesination, startTime, arrivalTime, typeOfVehicle, startDate, arrivalDate, trainPlatformStart, trainPlatformEnd, timeOfNextBus, timeToTransfer, expectedTransferTime = 0, stops) {
    this.tripId = tripId;
    this.duration = duration;
    this.numberOfTransfer = numberOfTransfer; //busnr
    this.nameOfTransfer = nameOfTransfer;
    this.srcStation = srcStation;
    this.destStation = destStation;
    this.lastDesination = lastDesination;
    this.startTime = startTime;
    this.arrivalTime = arrivalTime;
    this.typeOfVehicle = typeOfVehicle; // 0 zug, 5-7 bus, 8 seilbahn; more on documentation
    this.startDate = startDate;
    this.arrivalDate = arrivalDate;
    this.trainPlatformStart = trainPlatformStart; //
    this.trainPlatformEnd = trainPlatformEnd; //
    this.timeOfNextBus = timeOfNextBus;
    this.timeToTransferinMinutes = timeToTransfer;
    this.expectedTransferTime = expectedTransferTime;
    this.stops = stops.slice();
    this.depTimes = allStopDepTimes.slice();
    this.arrTimes = allStopArrivalTimes.slice();
    this.rtStartTime = rtStartTime;
    this.rtArrivalTime = rtArrivalTime;
    this.srcStationLatitude = srclatitude;
    this.srcStationLongitude = srclongitude;
    this.EndStationLatitude = destLatitude;
    this.EndStationLongitude = destLongitude;
  }

}
