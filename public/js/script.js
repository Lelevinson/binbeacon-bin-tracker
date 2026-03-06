import { RecBin, TwoBin, NorBin } from "./classes.js";

//const link = "http://localhost:3000"; // for dev
const link = "https://binbeacon.onrender.com";

//	Selectable tile layers
var osm = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
	maxZoom: 19,
	attribution: "© OpenStreetMap",
});

var stadiapi;
async function fetchAPI() {
	try {
		const response = await fetch(`${link}/configsta`);
		const data = await response.json();
		//backendURL = data.port;
		stadiapi = data;
	} catch (error) {
		console.error("Error fetching configuration:", error);
	}
}
fetchAPI();

//	map and user live location initiallization
var userMarker;
var userLatLng; // to record lat and lng value of user live location
var hasCenteredOnUser = false; // track if we've already centered on user location
var yuanZeCoords = [24.96953, 121.26747]; // Yuan Ze University fallback coords
var map = L.map("map", {
	center: yuanZeCoords,
	zoom: 18, // originally 16
	minZoom: 12, // maximum zoom is taoyuan
	doubleClickZoom: false, // remove double click for zoom
	zoomControl: false, // remove + - button for zoom
	layers: [osm],
})
	.locate({
		watch: "true",
		enableHighAccuracy: "true",
		// timeout: 120000 /* in milisecond */,
	}) // enabled user live location detection
	.on("locationfound", (e) => {
		userLatLng = e.latlng; // e is an object created when "locationfound" event is triggered, and contains informations about locationEvent like latlng
		if (!userMarker) {
			userMarker = new L.marker(e.latlng, {
				icon: L.icon({
					iconUrl: "/images/userlocmarker.gif",
					iconSize: [57, 57], // original size 3737
					iconAnchor: [19, 26],
					popupAnchor: [10, -20],
				}),
				alt: "user marker",
				title: "you are here!",
				riseOnHover: true,
			})
				.addTo(map)
				.bindPopup(
					L.popup({
						maxWidth: 300,
						maxHeight: 300,
						closeButton: true,
						autoPan: false,
					}).setContent(
						`<center>You are here!</center>`, // add button in the future
					),
				)
				.openPopup();
		} else {
			userMarker.setLatLng(e.latlng);
		}
		if (!hasCenteredOnUser) {
			map.setView(e.latlng, 18);
			hasCenteredOnUser = true;
		}
	})
	.on("locationerror", (error) => {
		if (userMarker) {
			map.removeLayer(userMarker);
			userMarker = undefined;
		}
	});

//	bin array logic implementation
var recBinsArr = [];
var norBinsArr = [];
var twoBinsArr = [];
let databaseArr = [];

//	Fetching data from the server
async function fetchCoords() {
	try {
		const response = await fetch(`${link}/ambil-marker`);

		if (!response.ok) {
			throw new Error("Failed to get coords");
		}

		const data = await response.json();
		databaseArr = data;
		//console.log("fetchcoordsshit: ", databaseArr);
	} catch (error) {
		console.error(error);
	}
}
fetchCoords();

//	Making and adding markers to the map
async function sort() {
	await fetchCoords();
	await fetchAPI();
	console.log("done fetching from fetchCoords:"); //, databaseArr[0].bintype);

	for (let i = 0; i < databaseArr.length; i++) {
		if (databaseArr[i].bintype === "Rec") {
			var rBin = new RecBin(databaseArr[i].corx, databaseArr[i].cory, map);
			recBinsArr.push(rBin.marker);
		} else if (databaseArr[i].bintype === "Two") {
			var tBin = new TwoBin(databaseArr[i].corx, databaseArr[i].cory, map);
			twoBinsArr.push(tBin.marker);
		} else {
			var nBin = new NorBin(databaseArr[i].corx, databaseArr[i].cory, map);
			norBinsArr.push(nBin.marker);
		}
	}

	console.log("result =", twoBinsArr);
	//	layer groups
	var recbins = L.layerGroup(recBinsArr);
	var norbins = L.layerGroup(norBinsArr);
	var twobins = L.layerGroup(twoBinsArr);

	twobins.addTo(map);
	recbins.addTo(map);
	norbins.addTo(map);

	var stadiaLight = L.tileLayer(
		`https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.{ext}?api_key=${stadiapi}`,
		{
			minZoom: 0,
			maxZoom: 20,
			attribution: "© StadiaMap",
			ext: "png",
		},
	);

	var stadiaDark = L.tileLayer(
		`https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.{ext}?api_key=${stadiapi}`,
		{
			minZoom: 0,
			maxZoom: 20,
			attribution: "© StadiaMap",
			ext: "png",
		},
	);

	var baseBins = {
		Standard: osm,
		Light: stadiaLight,
		Dark: stadiaDark,
	};

	var overlayBins = {
		"Recycling bins": recbins,
		"Non-recycling bins": norbins,
		"Pair of both": twobins,
	};

	var layerControl = L.control.layers(baseBins, overlayBins).addTo(map);
}
sort();

async function sendName(x, y) {
	await fetchCoords();

	var result = databaseArr.find((row) => row.corx === x && row.cory === y);
	var nama = result.name;
	var keadaan = result.stts;
	console.log("nama adalah: ", nama, "keadaaan adalah: ", keadaan);
	return result;
}
export { sendName };

async function updateStatus(x, y, updateValue) {
	// x and y will be parameters and will get them from classes.js
	await fetchCoords();

	//var hasil = databaseArr.find(row => row.corx === x && row.cory === y);
	//var updateValue = document.getElementById("trash-status").value;
	//habis itu situasi ini dikirim ke html terus user bakal dikasi 2 pilihan gt

	const paket = {
		corx: x,
		cory: y,
		stts: updateValue,
	};

	console.log("sampe ke upstats", updateValue);
	try {
		const res = await fetch(`${link}/update-status`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(paket),
		});
		const data = await res.json();
		console.log("Successupsas:", data);
	} catch (error) {
		console.error("Error:", error);
	}
}
updateStatus();

async function sendMarkersTDB(name, corx, cory, type, stts) {
	try {
		// corx cory type name and stts will be parameters
		//e.preventDefault()
		/*const dsata = {
		corx: "24.963777459758134", // 24.963777459758134, 121.25707667724481
		cory: "121.25707667724481", // tinggal implement user location
		type: "Nor",
		name: "YJ",
		stts: "Full",
	};*/
		const dsata = { corx, cory, type, name, stts };

		const res = await fetch(`${link}/tambah-marker-user`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(dsata),
		});

		const data = await res.json();

		if (res.ok) {
			console.log("Successaddmarker:", data);
			//alert("Success: Marker added. Please refresh.");
		} else {
			console.error("Erroraddmarker:", data);
			alert("Error: Failed to add marker.");
		}
	} catch (error) {
		console.error("Error:", error);
		alert("Error: Failed to add marker due to a network issue.");
	}
}

// ------------------------------------------------------- OVERLAY BUTTON  -------------------------------------------------------
const buttons = document.querySelectorAll(".btn");
for (let i = 0; i < buttons.length; i++) {
	if (buttons[i].getAttribute("data-action") === "reset-zoom") {
		buttons[i].addEventListener("click", function () {
			map.setView([userLatLng.lat, userLatLng.lng], 18);
		});
	} else if (buttons[i].getAttribute("data-action") === "reset-zoom-foradd") {
		buttons[i].addEventListener("click", function () {
			map.setView([userLatLng.lat + 0.001, userLatLng.lng], 18); // + 0.001 to account for map being pushed up
		});
	}
}

/* Set the width of the side navigation to 250px and the left margin of the page content to 250px */
window.openNavHeader = function () {
	document.getElementById("nav-header").style.height = "21%";
	document.getElementById("main").style.transform = "translateY(-23%)";
	document.getElementById("btn-question").classList.add("disabled");
	document.getElementById("btn-add").classList.add("disabled");
};

/* Set the width of the side navigation to 0 and the left margin of the page content to 0 */
window.closeNavHeader = function () {
	document.getElementById("nav-header").style.height = "0";
	document.getElementById("main").style.transform = "translateY(0)";
	document.getElementById("btn-question").classList.remove("disabled");
	document.getElementById("btn-add").classList.remove("disabled");
};

/* Set the width of the side navigation to 250px and the left margin of the page content to 250px */
window.openNavInfo = function () {
	document.getElementById("nav-info").style.height = "90%";
	document.getElementById("main").style.transform = "translateY(-90%)";
	document.getElementById("btn-header").classList.add("disabled");
	document.getElementById("btn-add").classList.add("disabled");
};

/* Set the width of the side navigation to 0 and the left margin of the page content to 0 */
window.closeNavInfo = function () {
	document.getElementById("nav-info").style.height = "0";
	document.getElementById("main").style.transform = "translateY(0)";
	document.getElementById("btn-header").classList.remove("disabled");
	document.getElementById("btn-add").classList.remove("disabled");
};

/* Set the width of the side navigation to 250px and the left margin of the page content to 250px */
window.openNavAdd = function () {
	document.getElementById("nav-add").style.height = "39%";
	document.getElementById("main").style.transform = "translateY(-43%)";
	document.getElementById("btn-header").classList.add("disabled");
	document.getElementById("btn-question").classList.add("disabled");
};

/* Set the width of the side navigation to 0 and the left margin of the page content to 0 */
window.closeNavAdd = function () {
	document.getElementById("nav-add").style.height = "0";
	document.getElementById("main").style.transform = "translateY(0)";
	document.getElementById("btn-header").classList.remove("disabled");
	document.getElementById("btn-question").classList.remove("disabled");
};

window.storeValues = function () {
	// Get the selected value of the first dropdown
	var userName = document.getElementById("userName").value || null; // Default to "null" if empty

	// Get the selected value of the second dropdown
	var trashType = document.getElementById("trash-type").value;

	// Get the selected value of the third dropdown
	var trashStatus = document.getElementById("trash-status").value;

	var lati = userLatLng.lat;
	var long = userLatLng.lng;

	if (trashType && trashStatus) {
		// to ensure user to select the type and status before submitting
		// Log the values to the console
		console.log("User Name:", userName);
		console.log("Trash Type:", trashType);
		console.log("Trash Status:", trashStatus);

		//sending value to function -> server -> databse
		sendMarkersTDB(userName, lati, long, trashType, trashStatus);
		refreshTwo();
	} else {
		alert("Please make sure to select both trash type and trash status.");
	}
};

window.storeUpdates = function (x, y) {
	var updateValue = document.getElementById("status-sampah").value;
	//if(updateValue === sm kyk value sblmnya)
	//	then alert error
	console.log("sampe ke stor", updateValue, x, y);
	updateStatus(x, y, updateValue);
};

window.refreshPage = async function () {
	await updateStatus();
	location.reload();
};

async function refreshTwo() {
	await sendMarkersTDB();
	location.reload();
}
