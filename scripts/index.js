let actualStopsSessions;
let actualStops = [];
let stops = []; //JSON with stopName and stopID
let interval = null;
let departureOrArrivalTime = true; //true means departure time, false means arrival time
let routeType = 0; // 0 -> least time, 1 -> leastInterchange, 2->leastWalking
let map = "";

window.onload = function () {

  //abfahrtenInput
  //wait for user to stopy typing for 250 seconds (library for 2 lines of code)
  $('#startInput').keyup(_.debounce(startInputEvent, 300));
  $('#endInput').keyup(_.debounce(endInputEvent, 300));
  $('#abfahrtenInput').keyup(_.debounce(abfahrtenInputEvent, 300));
  
  let date = new Date()
  let time = date.toLocaleTimeString().split(":");
  let srcInput = "";
  let destInput = "";
  let holeTrip = [];
  let urlSud = "";
  time.pop();
  
  if(document.getElementById('datePick'))
    document.getElementById('datePick').value = date.toISOString().split('T')[0];
  if(document.getElementById('timePick'))
    document.getElementById('timePick').value = time.join(":");

  setAutocompleteListeners();
  setInterval(printTime, 1000);

  //swipes for mobile devices
 /* document.addEventListener('swiped-left', function(e) {
    swipedToLeft();
  });
  document.addEventListener('swiped-right', function(e) {
    swipedToRight()
  });*/

  if (actualStops[0] === "null")
    actualStops.shift();

  addMap();

};


function addMap(){
  mapboxgl.accessToken = 'pk.eyJ1IjoiemJhYWtleiIsImEiOiJja3pvaXJ3eWM0bnV2MnVvMTc2d2U5aTNpIn0.RY-K9qwZD1hseyM5TxLzww';
  map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/streets-v11',
  center: [11.3586,46.4964],
  zoom: 10.5
  });
   
  map.on('load', () => {
    // Add zoom and rotation controls to the map.
    map.addControl(new mapboxgl.NavigationControl());
    map.addControl(new mapboxgl.FullscreenControl());
    
  // Add geolocate control to the map.
  map.addControl(
    new mapboxgl.GeolocateControl({
    positionOptions: {
    enableHighAccuracy: true
    },
    // When active the map will receive updates to the device's location as it changes.
    trackUserLocation: true,
    // Draw an arrow next to the location dot to indicate which direction the device is heading.
    showUserHeading: true
    })
  );
  });

  // Example of a MapMouseEvent of type "click"
map.on('click', (e) => {
  console.log(e);
  // {
  //     lngLat: {
  //         lng: 40.203,
  //         lat: -74.451
  //     },
  //     originalEvent: {...},
  //     point: {
  //         x: 266,
  //         y: 464
  //     },
  //      target: {...},
  //      type: "click"
  // }
  });

}


function printTime() {
  let d = new Date();
  let s = d.getSeconds();
  let m = d.getMinutes();
  let h = d.getHours();
  try{
    let x = document.getElementById("spanTime");
    if(($(window).width()>=600) && (x==null)){
      document.getElementById("nav").innerHTML += '<div id="rightHead"><h5><div id="spanTime"></div></h5></div>'
    }
    if (window.getComputedStyle(x).visibility === "hidden") {
      document.getElementById("rightHead").remove();
    }
    
  }catch{
    return;
  }

  try{
    document.getElementById("spanTime").textContent = ("0" + h).substr(-2) + ":" + ("0" + m).substr(-2) + ":" + ("0" + s).substr(-2);
  }catch {
    
  }
     
}

window.onbeforeunload = function () {
  window.scrollTo(0, 0);
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


function swipedToRight(){
  if(!document.getElementById("moveBtn").textContent.includes("Abfahrten")){
    $("#about-2").toggle("slide", { direction: "right" }, 400);
    $("#about-1").toggle("slide", { direction: "left" }, 400);
    window.scrollTo({top: 0, behavior: 'smooth'});
    document.getElementById("moveBtn").innerHTML = "Zu Abfahrten"
  }
}
function swipedToLeft(){
  
  if(document.getElementById("moveBtn").textContent.includes("Abfahrten")){
    document.getElementById("abfahrtenTable").hidden = true;
    hideFalseAfterLoading(400);
    $("#about-2").toggle("slide", { direction: "right" }, 400);
    $("#about-1").toggle("slide", { direction: "left" }, 400);
    window.scrollTo({top: 0, behavior: 'smooth'});
    document.getElementById("moveBtn").innerHTML = "Zu Verbindungen"
  }

}

function transistPage() {

  $("#about-2").toggle("slide", { direction: "right" }, 500);
  $("#about-1").toggle("slide", { direction: "left" }, 500);
  window.scrollTo({top: 0, behavior: 'smooth'});
  if (document.getElementById("moveBtn").textContent.includes("Abfahrten")) {
    document.getElementById("moveBtn").innerHTML = "Zu Verbindungen"
    document.getElementById("abfahrtenTable").hidden = true;
    hideFalseAfterLoading(500);
  } else {
    document.getElementById("moveBtn").innerHTML = "Zu Abfahrten"
  }
}

async function hideFalseAfterLoading(time) {
  await new Promise(resolve => setTimeout(resolve, time));
  document.getElementById("abfahrtenTable").hidden = false;
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


    text = text.split(" ").join("%20");// name_origin=46.496901,11.3587048:WGS84[DD.DDDDD]
    let urlStops = 'https://efa.sta.bz.it/apb/XML_STOPFINDER_REQUEST?locationServerActive=1&outputFormat=JSON&language=de&type_sf=any&name_sf=' + text;
    console.log(urlStops);
    try {
      fetch(urlStops).then(res => res.json()).then(data => { handleStops(data); }).catch(function () {return;});;
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
      if (!actualStops.includes(data["stopFinder"]["points"]["point"]["name"])){
        actualStops.push(data["stopFinder"]["points"]["point"]["name"]);
        let stopToPush = {
          "stopName": data["stopFinder"]["points"]["point"]["name"],
          "stopID": data["stopFinder"]["points"]["point"]["stateless"]
        }
        stops.push(stopToPush)
      }
      //Bozen gibt komische Daten
      //https://efa.sta.bz.it/apb/XML_STOPFINDER_REQUEST?locationServerActive=1&outputFormat=JSON&language=de&type_sf=any&name_sf=Bozen
      if (data["stopFinder"]["points"]["point"]["name"] === "Bozen, Bahnhof Bozen") {
        //add Bozen Süd, Kaiserau, ...
        if (!actualStops.includes("Bozen, Bahnhof Bozen Süd")){
          let stopToPush = {
            "stopName": "Bozen, Bahnhof Bozen Süd",
            "stopID": "66002210"
          }
          stops.push(stopToPush)
          actualStops.push("Bozen, Bahnhof Bozen Süd");
        }
        if (!actualStops.includes("Bozen, Bahnhof Bozen Kaiserau")){
          let stopToPush = {
            "stopName": "Bozen, Bahnhof Bozen Kaiserau",
            "stopID": "66002132"
          }
          stops.push(stopToPush)
          actualStops.push("Bozen, Bahnhof Bozen Kaiserau");
        }
        if (!actualStops.includes("Bozen, Lama Bozen")){
          let stopToPush = {
            "stopName": "Bozen, Lama Bozen",
            "stopID": "66002175"
          }
          stops.push(stopToPush)
          actualStops.push("Bozen, Lama Bozen");
        }
        
          
      }
    }
    else if (data["stopFinder"]["points"].length > 0) {
      for (let i = 0; i < data["stopFinder"]["points"].length; i++) {
        if (!actualStops.includes(data["stopFinder"]["points"][i]["name"]) && data["stopFinder"]["points"][i]["anyType"] === "stop"){
          
          let stopToPush = {
            "stopName": data["stopFinder"]["points"][i]["name"],
            "stopID": data["stopFinder"]["points"][i]["stateless"]
          }
          stops.push(stopToPush)
          actualStops.push(data["stopFinder"]["points"][i]["name"])
        }
        
          
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
  //  maxResults: 10,
    minLength: 2,
    delay: 300,
    source: function (request, response) {
      var results = $.ui.autocomplete.filter(actualStops, request.term);
      response(results.slice(0, this.options.maxResults));
    },
    messages: {
      noResults: '',
      results: function () { }
    },select: function (event, ui) {
      //disable keyboard on phones
      let el= document.getElementById("startInput");
      el.inputMode="none";
      reenableKeyboardPhone(el);
      el.classList.remove("loading");
    }
  });
  $("#endInput").autocomplete({
   // maxResults: 10,
    minLength: 2,
    delay: 300,
    source: function (request, response) {
      var results = $.ui.autocomplete.filter(actualStops, request.term);
      response(results.slice(0, this.options.maxResults));
    },
    messages: {
      noResults: '',
      results: function () { }
    },select: function (event, ui) {
      //disable keyboard on phones
      let el= document.getElementById("endInput");
      el.inputMode="none";
      reenableKeyboardPhone(el);
      el.classList.remove("loading");
    }
  });
  $("#abfahrtenInput").autocomplete({
   // maxResults: 10,
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
      //disable keyboard on phones
      let el=document.getElementById("abfahrtenInput");
      el.inputMode="none"
      el.classList.remove("loading");
      if (interval !== null)
        clearInterval(interval);
      
      clearTable();
      document.getElementById("spinner3").hidden = false;
      getDepartures(ui.item.label)
      let stationID="";
      for(let i in stops) {
        if(stops[i]["stopName"]===ui.item.label)
          stationID=stops[i]["stopID"];
     }
      reenableKeyboardPhone(el)
      getDepartures(stationID)
      reenableKeyboardPhone(el)
      interval = setInterval(function () {
        getDepartures(stationID)
      }, 30 * 1000);

    }

  });

  
}

async function reenableKeyboardPhone(el) {
  await new Promise(resolve => setTimeout(resolve, 500));
  el.inputMode = "search";
}

function searchConnection() {

  for(let i = 0;;i++){
    var mapLayer = map.getLayer('route'+i);
    if(typeof mapLayer !== 'undefined') {
      // Remove map layer & source.
      map.removeLayer('route'+i).removeSource('route'+i);
    }
    else
      break;
  }

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

  srcInput = document.getElementById("startInput").value.trim();
  destInput = document.getElementById("endInput").value.trim();

  let srcID="", destID="";
  for(let i in stops) {
    if(stops[i]["stopName"] === srcInput)
      srcID=stops[i]["stopID"];
    if(stops[i]["stopName"] === destInput)
      destID=stops[i]["stopID"];
    if(srcID!=="" && destID!=="")
      break;
 }

 if((srcID==="" || destID==="") && (srcInput.length>3 && destInput.length>3)){
  for(let i in stops) {
    if(stops[i]["stopName"].includes(srcInput) && srcID === "")
      srcID=stops[i]["stopID"];
    if(stops[i]["stopName"].includes(destInput) && destID==="")
      destID=stops[i]["stopID"];

    if(srcID!=="" && destID!=="")
      break;
  }
 }
  get2PointConnection(srcID, destID);

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

  if(src == "" || dest == ""){
    document.getElementById("spinner").hidden = true;
    document.getElementById("searchButton").disabled = false;
    document.getElementById("outputRoutes").innerHTML = "Gib gültige Haltestellen ein."
    document.getElementById("outputRoutes").style.color = "red"
    return;
  }

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
 // stopsClass


  urlSud = 'https://efa.sta.bz.it/apb/XML_TRIP_REQUEST2?locationServerActive=1&language=de&stateless=%201&type_origin=any&name_origin=' + srcString + '&type_destination=any&name_destination=' + destString + '&' + arrOrDepTimeString + '&itdTime=' + startTime + '&itdDate=' + startDate + '&calcNumberOfTrips=' + howManyTrips + '&maxChanges=' + maxChanges + routeTypeString + '&useProxFootSearch=1&coordOutputFormatTail=4&outputFormat=JSON&coordOutputFormat=WGS84[DD.DDDDD]';
  console.log(urlSud)
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


async function findTempByCoord(longitude, latitude) { //src === true if srcstation, else deststation
  //get temperature of nearest point
  let error2 = 0;
  let t = "";

  if(longitude == null || latitude == null || longitude == undefined || latitude == undefined)
    return ["/", [""]];

  const openWeather = await fetch('https://api.openweathermap.org/data/2.5/weather?lat=' + latitude + '&lon=' + longitude + '&appid=dc704448494ba8187b5e3cf65aafac7f&units=metric')
    .catch(function () {
      error2 = 1;
    });;

  let desc = ""
 
  if (error2 === 0) {
    const openWeatherData = await openWeather.json();
    desc = openWeatherData["weather"][0]["description"];
    t = openWeatherData["main"]["temp"];
  } else {
    return ["/", [""]];
  }

  switch(desc){
    case "": urlAdd = ""; break;
    case "clear sky": urlAdd="Klarer Himmel"; break;
    case "few clouds": urlAdd="Wenige Wolken ☁"; break;
    case "scattered clouds": urlAdd="Wolken ☁"; break;
    case "broken clouds": urlAdd="Wolken ☁"; break;
    case "shower clouds": urlAdd="Regenwolken ☁"; break;
    case "overcast clouds": urlAdd="Wolken";break;
    case "light rain": urlAdd="Leichter Regen";break;
    case "rain": urlAdd="Regen 🌧️"; break;
    case "thunderstorm": urlAdd="Gewitter ⛈️"; break;
    case "snow": urlAdd="Schneefall ❄️"; break;
    case "mist": urlAdd="Nebelig 🌫️"; break;
    default: urlAdd="";
  }
  let value = [];
  value.push(Number(t).toFixed(1));
  value.push(urlAdd)
  return value;
}



function padTo2Digits(num) {
  return num.toString().padStart(2, '0');
}

function drawThisRouteToMap(route){
  var isExpanded = $("#0heading"+route).attr("aria-expanded");
  if(isExpanded == "false")
    return;
  
  //delete current route
  for(let i = 0;;i++){
    var mapLayer = map.getLayer('route'+i);
    if(typeof mapLayer !== 'undefined') {
      // Remove map layer & source.
      map.removeLayer('route'+i).removeSource('route'+i);
    }
    else
      break;
  }
  
  // draw new route
  for(let i =0; i<holeTrip[route].subTrip.length; i++){
    writePathToMap(route, holeTrip[route].subTrip[i].path, i, holeTrip[route].subTrip[i].typeOfVehicle)
  }
  for(let i = 0; i<holeTrip[route].subTrip.length; i++){
    //to do!! mark first and last station
    writeTripStationsToMap(route, holeTrip[route].subTrip[i].stopCoords, i, holeTrip[route].subTrip[i].typeOfVehicle)
  }

}

async function buildFrontend(holeTrip) {

  let code = "";
  let srcTemp1="";
  let destTemp1="";
  //Frontend zusammenbauen
  try{
    srcTemp1 = await findTempByCoord(Number(holeTrip[0].subTrip[0].srcStationLongitude), Number(holeTrip[0].subTrip[0].srcStationLatitude));
    destTemp1 = await findTempByCoord(Number(holeTrip[0].subTrip[0].EndStationLongitude), Number(holeTrip[0].subTrip[0].EndStationLatitude));
  }catch{
  }

  let d1 = new Date();
  let today = (padTo2Digits(d1.getDate())) + "." + (padTo2Digits(d1.getMonth() + 1)) + "." + d1.getFullYear();

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
    code += '<button class="accordion-button collapsed" id="0heading'+i+'" onclick="drawThisRouteToMap('+i+')" type="button" data-bs-toggle="collapse"\n';
    code += ' data-bs-target="#collapseRoute' + i + '" aria-expanded="false" aria-controls="collapseRoute' + i + '">\n';

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
    if (holeTrip[i].subTrip[0].startDate != today)
      date = ", " + holeTrip[i].subTrip[0].startDate + "";

    if (holeTrip[i].subTrip.length > 1) {

      code += '' + holeTrip[i].subTrip[0].rtStartTime + ' - ' + holeTrip[i].subTrip[holeTrip[i].subTrip.length - 1].rtArrivalTime + ', '+ holeTrip[i].holeDuration + ' Std<br>Von: ' + holeTrip[i].subTrip[0].srcStation + '' + date + '</h5>\n';
    } else {
      code += '' + holeTrip[i].subTrip[0].rtStartTime + ' - ' + holeTrip[i].subTrip[0].rtArrivalTime + ', '+ holeTrip[i].holeDuration + ' Std<br>Von: ' + holeTrip[i].subTrip[0].srcStation + '' + date + '</h5>\n';
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
  document.getElementById("outputRoutes").innerHTML += code + '<div class="d-flex justify-content-center"><div hidden="true"  id ="spinner2" class="spinner-border" style="width: 2.5rem; height: 2.5rem; color: #348AC7;" role="status"><span class="sr-only"></span> </div></div>';
  document.getElementById("outputRoutes").innerHTML += '<button onclick="searchMore()" id="searchMore" class="btn-dark-blue btn-rounded">Weitere Routen suchen!</button>';
  document.getElementById("spinner").hidden = true;
  document.getElementById("spinner2").hidden = true;
  document.getElementById("searchMore").disabled = false;
  document.getElementById("searchButton").disabled = false;
  
}


function writeTripStationsToMap(tripNr, coord, changeNr, typeOfVehicle){
  let color = chooseColor(typeOfVehicle);



}

function chooseColor(typeOfVehicle){
  if (typeOfVehicle === "5" || typeOfVehicle === "6" || typeOfVehicle === "7") //bus
    return "blue";
  else if (typeOfVehicle === "0") // zug
    return "black";
  else if (typeOfVehicle === "8") // Seilbahn
    return "brown";
  else //zufuß oder anderes mittel
    return "grey";
  
}

function writePathToMap(tripNr, path, changeNr, typeOfVehicle){

  let color = chooseColor(typeOfVehicle);
  
  let pathCoord = path.split(" ");
  let coordArray = [];
 
  for(let i = 0; i<pathCoord.length;  i++){
    if(pathCoord[i] == undefined)
      break;

   coordArray.push([pathCoord[i].substr(0, pathCoord[i].indexOf(",")), pathCoord[i].substr(pathCoord[i].indexOf(",")+1)]);
  
  }

  if(changeNr===0)
    map.flyTo({center:[coordArray[0][0], coordArray[0][1]]});
 

  map.addSource('route'+changeNr, {
    'type': 'geojson',
    'data': {
    'type': 'Feature',
    'properties': {},
    'geometry': {
    'type': 'LineString',
    'coordinates': coordArray
    }
    }
    });
    map.addLayer({
    'id': 'route'+changeNr,
    'type': 'line',
    'source': 'route'+changeNr,
    'layout': {
    'line-join': 'round',
    'line-cap': 'round'
    },
    'paint': {
    'line-color': color,
    'line-width': 4
    }
    });

    

}


function searchMore() {
  document.getElementById("spinner2").hidden = false;
  document.getElementById("searchMore").disabled = true;
  let lengthtripsBefore = holeTrip.length;
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
     // document.getElementById("outputRoutes").innerHTML = "";
     // buildFrontend(holeTrip);
     document.getElementById("searchMore").remove();
     document.getElementById("spinner2").remove();
      addTripsToFrontend(holeTrip, lengthtripsBefore)
    } else {
      //Wenn wegen falscher eingabe oder anderen fehlern keine Routen gefunden werden
      console.error("Error! No route found!")
      document.getElementById("spinner").hidden = true;
      document.getElementById("searchButton").disabled = false;
      document.getElementById("outputRoutes").innerHTML = "Ein Fehler ist aufgetreten!"
      document.getElementById("outputRoutes").style.color = "red"
    }

  }).fail(function () {
    console.error("Error! No route found!")
    document.getElementById("spinner").hidden = true;
    document.getElementById("searchButton").disabled = false;
    document.getElementById("outputRoutes").innerHTML = "Ein Fehler ist aufgetreten!"
    document.getElementById("outputRoutes").style.color = "red"
  });

}


async function addTripsToFrontend(holeTrip, lengthBefore){

  let code = "";
  let d1 = new Date();
  let today = (padTo2Digits(d1.getDate())) + "." + (padTo2Digits(d1.getMonth() + 1)) + "." + d1.getFullYear();

  for (let i = lengthBefore; i < holeTrip.length; i++) {

    code = "<br>";
    code += '<div class="accordion">\n';
    code += '<h2 class="accordion-item" id="headingRoute' + i + '">\n';
    code += '<button  class="accordion-button collapsed" id="0heading'+i+'" onclick="drawThisRouteToMap('+i+')" type="button" data-bs-toggle="collapse"\n';
    code += ' data-bs-target="#collapseRoute' + i + '" aria-expanded="false" aria-controls="collapseRoute' + i + '">\n';
    code += '<div class="transferListOutput">'
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
    if (holeTrip[i].subTrip[0].startDate != today)
      date = ", " + holeTrip[i].subTrip[0].startDate + "";

    if (holeTrip[i].subTrip.length > 1) {

      code += ''+ holeTrip[i].subTrip[0].rtStartTime + ' - ' + holeTrip[i].subTrip[holeTrip[i].subTrip.length - 1].rtArrivalTime +', ' +holeTrip[i].holeDuration + ' Std<br>Von: ' + holeTrip[i].subTrip[0].srcStation + '' + date + '</h5>\n';
    } else {
      code += ''+holeTrip[i].subTrip[0].rtStartTime + ' - ' + holeTrip[i].subTrip[0].rtArrivalTime + ', '+holeTrip[i].holeDuration + ' Std<br>Von: ' + holeTrip[i].subTrip[0].srcStation + '' + date + '</h5>\n';
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
  document.getElementById("outputRoutes").innerHTML += code + '<div class="d-flex justify-content-center"><div hidden="true"  id ="spinner2" class="spinner-border" style="width: 2.5rem; height: 2.5rem; color: #348AC7;" role="status"><span class="sr-only"></span> </div></div>';
  document.getElementById("outputRoutes").innerHTML += '<button onclick="searchMore()" id="searchMore" class="btn-dark-blue btn-rounded">Weitere Routen suchen!</button>';
  document.getElementById("spinner").hidden = true;
  document.getElementById("spinner2").hidden = true;
  document.getElementById("searchMore").disabled = false;



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
    let path;
    let stopCoords = [];

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
      path = this.trip["legs"][i]["path"];
    

      stops = [];
      allStopDepTimes = [];
      allStopArrivalTimes = [];
      stopCoords = [];
      //find all stops on your way
      if (this.trip["legs"][i]["stopSeq"] != undefined) {
        for (let x = 0; x < this.trip["legs"][i]["stopSeq"].length; x++) {
          stops.push(this.trip["legs"][i]["stopSeq"][x]["name"]); //read all station names
          stopCoords.push(this.trip["legs"][i]["stopSeq"][x]["ref"]["coords"]);
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
        trainPlatformEnd, timeOfNextBus, timeToTransfer, expectedTransferTime, stops, path, stopCoords);

    }

  }

}


class SubTrip {
  //evtl busseite usw
  constructor(tripId, duration, rtStartTime, srclatitude, srclongitude, destLatitude, destLongitude, rtArrivalTime, 
    allStopDepTimes, allStopArrivalTimes, nameOfTransfer, numberOfTransfer, srcStation, destStation, lastDesination, startTime, 
    arrivalTime, typeOfVehicle, startDate, arrivalDate, trainPlatformStart, trainPlatformEnd, timeOfNextBus, timeToTransfer, 
    expectedTransferTime = 0, stops, path, stopCoords) {

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
    this.path = path; //path of hole route for map
    this.stopCoords = stopCoords.slice(); //longtitude,latitude of all stops for map
  }

}
