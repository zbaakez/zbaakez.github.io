let arrival = [];
let startTime = [];
let destination = [];
let direction = [];
let platform = [], platformName = [];
let xCoordValues = [], yCoordValues = [];
let typeVehicle = [];
let size;
let stationSave=0;
let countStops;
let error5 = false;

async function write(){

    let temp="";
    
    temp = await findTempByCoord(xCoordValues[0], yCoordValues[0]);
    

    if(document.getElementById("spinner3") !== null)
        document.getElementById("spinner3").hidden = true;
    document.getElementById("abfahrtenTemperatur").innerHTML = "<h5>Temperatur: "+temp[0]+" °C  -  "+temp[1]+"</h5>";
    document.getElementById("abfahrtenTemperatur").hidden = false;
    
    let size=1;
    if(arrival.length != null)
        size = Math.min(20, arrival.length);
    

    if(!error5){
    for(let i=1;i<=size;i++){

        if(arrival[i] == undefined)
            break;

        if(typeVehicle[i] == "0")
            document.getElementById('busNr' + i).innerHTML = "🚆 "+arrival[i];
        else if(typeVehicle[i] == "5" || typeVehicle[i] == "6" || typeVehicle[i] == "7" || typeVehicle[i] == "10"){
            document.getElementById('busNr' + i).innerHTML = "🚌 "+arrival[i];
        }else if(typeVehicle[i] == "8"){
            document.getElementById('busNr' + i).innerHTML = "🚠 "+arrival[i];
        }else{
            document.getElementById('busNr' + i).innerHTML = arrival[i];
        }

        document.getElementById('start' + i).innerHTML = startTime[i];
        document.getElementById('ankunft'+ i).innerHTML = destination[i];

        if(platform[i]==7001){
            document.getElementById('seite'+ i).innerHTML = "Nordseite";
        }
        else if(platform[i]==8296){
            document.getElementById('seite'+ i).innerHTML = "Südseite";
        }else{
            
           
            if(typeVehicle[i] == "0"){ //zug
                document.getElementById('seite'+ i).innerHTML = "Gleis "+platformName[i];
            }else if(platformName[i] != null || platformName[i] != undefined || platformName[i] != ""){
                document.getElementById('seite'+ i).innerHTML = "Steig "+platformName[i];
            }
            else
                document.getElementById('seite'+ i).innerHTML = "/";
        }
        
    }
    }

}


async function clearTable(){
    
        for(let i=1;i<=20;i++){
            document.getElementById('busNr' + i).innerHTML = "";
            document.getElementById('start' + i).innerHTML = "";
            document.getElementById('ankunft'+ i).innerHTML = "";
            document.getElementById('seite'+ i).innerHTML = "";
        }     

}



async function getDepartures(station){

    if(station === "")
        return;

    station = station.split(" ").join("%20");
    stationSave = station;
    
    let haltestellenLink = "https://efa.sta.bz.it/apb/XML_DM_REQUEST?&locationServerActive=1&outputFormat=JSON&stateless=1&type_dm=any&name_dm="+station+"&mode=direct&coordOutputFormatTail=4&outputFormat=JSON&coordOutputFormat=WGS84[DD.DDDDD]&limit=21";
    await fetch(haltestellenLink)  
    .then(res => res.json())
    .then(data =>{getData(data);})
    .catch(err => {  
   
    });  
    
    write();
    
}

async function getData(data){
    
    if(data["departureList"]==null || data ==null){
        error5 = true;
        for(let i=1;i<=20;i++){
            
            document.getElementById('busNr' + i).innerHTML = "";
            document.getElementById('start' + i).innerHTML = "";
            document.getElementById('ankunft'+ i).innerHTML = "";
            document.getElementById('seite'+ i).innerHTML = "";
        }
        clearTable();
        
    }else
        error5=false;

    try{
        size = (data["departureList"]).length;
    }catch(error){
        size=0;
    } 
    

    countStops = 0;
    let hour;
    let minute;
    let busStops = [];
    arrival = [];
    yCoordValues=[];
    platform=[];
    platformName=[];
    typeVehicle=[];
    for(let i=0;i<size;i++){
    
        arrival[i] = (data["departureList"][i]["servingLine"]["number"]);
        xCoordValues[i] = data["departureList"][i]["x"];
        yCoordValues[i] = data["departureList"][i]["y"];
        platform[i] = data["departureList"][i]["platform"];
        platformName[i] = data["departureList"][i]["platformName"];
        typeVehicle[i] = data["departureList"][i]["servingLine"]["motType"];
        hour = (data["departureList"][i]["dateTime"]["hour"]);
        minute = (data["departureList"][i]["dateTime"]["minute"]);
        if(minute<10){
            minute = "0" + minute;
        }
        startTime[i] = hour + ":" + minute;
        destination[i] = (data["departureList"][i]["servingLine"]["direction"]);
        
        direction[i] = (data["departureList"][i]["servingLine"]["liErgRiProj"]["direction"]);

            
    }
    return;
}