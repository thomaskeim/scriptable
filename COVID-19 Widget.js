// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: red; icon-glyph: first-aid;





// icon-color: red; icon-glyph: first-aid;
// Licence: Robert Koch-Institut (RKI), dl-de/by-2-0
// https://npgeo-corona-npgeo-de.hub.arcgis.com/datasets/917fc37a709542548cc3be077a786c17_0

// Define URLs based on the corona.rki.de webpage

const newCasesApiUrl = `https://services7.arcgis.com/mOBPykOjAyBO2ZKk/arcgis/rest/services/RKI_COVID19/FeatureServer/0/query?f=json&where=NeuerFall%20IN(1%2C%20-1)&returnGeometry=false&spatialRel=esriSpatialRelIntersects&outFields=*&outStatistics=%5B%7B%22statisticType%22%3A%22sum%22%2C%22onStatisticField%22%3A%22AnzahlFall%22%2C%22outStatisticFieldName%22%3A%22value%22%7D%5D&resultType=standard&cacheHint=true`;

const incidenceUrl = (location) => `https://services7.arcgis.com/mOBPykOjAyBO2ZKk/arcgis/rest/services/RKI_Landkreisdaten/FeatureServer/0/query?where=1%3D1&outFields=GEN,last_update,cases,cases7_per_100k,BL,cases7_bl_per_100k&geometry=${location.longitude.toFixed(3)}%2C${location.latitude.toFixed(3)}&geometryType=esriGeometryPoint&inSR=4326&spatialRel=esriSpatialRelWithin&returnGeometry=false&outSR=4326&f=json`

const vaccineStatus = "https://rki-vaccination-data.vercel.app/api";


this.stateToAbbr = {
      "Baden-Württemberg": "BW",
      "Bayern": "BY",
      "Berlin": "BE",
      "Brandenburg": "BB",
      "Bremen": "HB",
      "Hamburg": "HH",
      "Hessen": "HE",
      "Mecklenburg-Vorpommern": "MV",
      "Niedersachsen": "NI",
      "Nordrhein-Westfalen": "NRW",
      "Rheinland-Pfalz": "RLP",
      "Saarland": "SL",
      "Sachsen": "SN",
      "Sachsen-Anhalt": "ST",
      "Schleswig-Holstein": "SH",
      "Thüringen": "TH",
    };




const saveIncidenceLatLon = (location) => {
 let fm = FileManager.iCloud()
//  let fm = FileManager.local()
 let path = fm.joinPath(fm.documentsDirectory(), "covid19latlon.json")
 fm.writeString(path, JSON.stringify(location))
}

const getsavedIncidenceLatLon = () => {
 let fm = FileManager.iCloud()
//  let fm = FileManager.local()
 let path = fm.joinPath(fm.documentsDirectory(), "covid19latlon.json")
 let data = fm.readString(path)
 return JSON.parse(data)
}

let widget = await createWidget()
if (!config.runsInWidget) {
 await widget.presentSmall()
}

Script.setWidget(widget)
Script.complete()

async function createWidget(items) {
 let data, attr, header, label

   const list = new ListWidget()
  
   list.url = "https://experience.arcgis.com/experience/478220a4c454480e823b17327b2bf1d4"
  


// fetch new cases
data = await new Request(newCasesApiUrl).loadJSON()

if(!data || !data.features || !data.features.length) {
  const errorList = new ListWidget()
  errorList.addText("Keine Ergebnisse für die Anfrage nach den Neuinfektionen.")
  return errorList
}

header = list.addText("🦠 COVID-19 DE".toUpperCase())
header.font = Font.mediumSystemFont(11)

label = list.addText("+" + parseInt(data.features[0].attributes.value).toLocaleString());
// label = list.addText("+" + new Intl.NumberFormat('de-DE').format(data.features[0].attributes.value));
label.font = Font.mediumSystemFont(18)

// const country = list.addText("Deutschland")
// country.font = Font.mediumSystemFont(12)
// country.textColor = Color.gray()


      
      
list.addSpacer()


// fetch new incidents
let location

if(args.widgetParameter) {

   const fixedCoordinates = args.widgetParameter.split(",").map(parseFloat)

   location = {
     latitude: fixedCoordinates[0],
     longitude: fixedCoordinates[1]
   }

 } else {

   Location.setAccuracyToThreeKilometers()
     try {
     location = await Location.current()
     console.log('get current lat/lon')
     saveIncidenceLatLon(location)
   } catch(e) {
     console.log('using saved lat/lon')
     location = getsavedIncidenceLatLon()
   }
 }


data = await new Request(incidenceUrl(location)).loadJSON()

if(!data || !data.features || !data.features.length) {
   const errorList = new ListWidget()
   errorList.addText("Keine Ergebnisse für den aktuellen Ort gefunden.")
   return errorList
}

attr = data.features[0].attributes
const incidence = attr.cases7_per_100k.toFixed(1)
const cityName = attr.GEN
const cases = attr.cases
const lastUpdate = attr.last_update
const bl = attr.BL
const incidencebl = attr.cases7_bl_per_100k.toFixed(1)
const areaName = this.stateToAbbr[attr.BL]



header = list.addText("🦠 7TI " + cityName.toUpperCase())
header.font = Font.mediumSystemFont(11)

const incidenceStack = list.addStack();
      incidenceStack.centerAlignContent();

const incicenceCityStack = incidenceStack.addStack();
value = incicenceCityStack.addText(parseFloat(incidence).toLocaleString());
//value = incicenceCityStack.addText(new Intl.NumberFormat('de-DE').format(incidence));
    value.font = Font.mediumSystemFont(18);
    if (incidence >= 50) {
      value.textColor = Color.red();
    } else if (incidence >= 35) {
      value.textColor = Color.orange();
    } else if (incidence >= 25) {
      value.textColor = Color.yellow();
    }

incidenceStack.addSpacer(8);

const incidenceBlStack = incidenceStack.addStack();
      incidenceBlStack.layoutVertically();
      incidenceBlStack.centerAlignContent();
      incidenceBlStack.setPadding(2, 4, 2, 4);
      incidenceBlStack.backgroundColor = new Color("#888888", 0.3);
      incidenceBlStack.cornerRadius = 4;

const value_area = incidenceBlStack.addText(areaName + ": " +parseFloat(incidencebl).toLocaleString());
      value_area.font = Font.mediumSystemFont(10);

// const label_area = incidenceBlStack.addText(areaName);
//       label_area.font = Font.mediumSystemFont(8);

// const label_city = list.addText(cityName);
//       label_city.font = Font.mediumSystemFont(12);
//       label_city.textColor = Color.gray();
    
list.addSpacer(8)


// fetch new vaccines
const number = await getVaccineData();
console.log(number);

let amount =  number.value.toLocaleString();
console.log(amount);
      
const date = await getVaccineUpdateDate();
console.log(date);
      
let statusdate =  date.value.toLocaleString();
console.log(statusdate);     
  

header = list.addText("💉 " + "Impfungen".toUpperCase());
header.font = Font.mediumSystemFont(11);

value = list.addText(amount + statusdate);
value.font = Font.mediumSystemFont(14);


list.addSpacer(8)


lastupdate = list.addText ("letztes Update: "+lastUpdate.substr(0,10))
lastupdate.font = Font.mediumSystemFont(8)  

return list
}


// Get vaccine Status - Impfstatus
async function getVaccineData() {
  let data = await new Request(vaccineStatus).loadJSON();
  const attr = data.vaccinated;
  return {
    value: attr,
  };
}

async function getVaccineUpdateDate() {
  let data = await new Request(lastUpdateDate).loadJSON();
  const attr = data.lastUpdate;
  return {
    value: attr,
  };
}


