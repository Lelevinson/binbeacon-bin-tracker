import express from "express";
import path from "path";
import cors from "cors";
import { gettingCoords } from "./markergetter.js";
import supabase from "./supabaseClient.js";

import dotenv from "dotenv";
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const stadia = process.env.STADIA_API;

app.use(cors());
app.use(express.json());
//------------------------------------------------------------------------------
const __dirname = path.resolve();
app.use(express.static(path.join(__dirname, "public")));
//------------------------------------------------------------------------------
app.get("/ambil-marker", async (req, res) => {
	const coords = await gettingCoords();
	res.json(coords);
});
//------------------------------------------------------------------------------
app.get("/configsta", (req, res) => {
	res.json({ stadia });
});
//------------------------------------------------------------------------------
app.post("/tambah-marker-user", async (req, res) => {
	const { corx, cory, type, name, stts } = req.body;
	console.log(name, type, cory);

	try {
		await addingMarkersTDB(corx, cory, type, name, stts);
		res.json("tambah marker user received");
	} catch (error) {
		res.json("gbs add");
	}
});
//------------------------------------------------------------------------------
app.post("/update-status", async (req, res) => {
	const { corx, cory, stts } = req.body;
	console.log("Parsed values of upstats:", { corx, cory, stts });

	try {
		await renewStatus(corx, cory, stts);
		res.json("stts anjuser received");
	} catch (error) {
		console.error("Error during update:", error);
		res.status(500).json({ error: "Failed to update status.", details: error });
	}
});
//------------------------------------------------------------------------------
app
	.listen(port, () => {
		console.log("running server on port:", port);
	})
	.on("error", (err) => {
		console.error("Server error:", err);
	});
//------------------------------------------------------------------------------

const addingMarkersTDB = async (x, y, tipe, nama, stats) => {
	//sendcurrentloc

	let userCorX = x;
	let userCorY = y;
	let userBinType = tipe;
	let userName = nama;
	let binStatus = stats;
	console.log(userCorX, userCorY, userBinType, userName, binStatus);

	try {
		let { data: markers1, error } = await supabase.from("markers1").insert({
			coordinate_x: userCorX,
			coordinate_y: userCorY,
			type: userBinType,
			creator: userName || null,
			status: binStatus,
		});

		console.log("hrsnya oke");
		/*if (markers1) {
			console.log(markers1);
		}*/

		if (error) {
			console.log("supaerror", error);
			throw new Error(error.message);
		}
	} catch (error) {
		console.log(error);
	}
};
//------------------------------------------------------------------------------

async function renewStatus(x, y, stts) {
	console.log("stts adalh:", stts);
	const { data, error } = await supabase
		.from("markers1")
		.update({ status: stts })
		.eq("coordinate_x", x)
		.eq("coordinate_y", y);

	if (error) {
		console.error("Supabase error:", error.message, error.details);
		throw new Error(error.message); // Pass error to the calling function
	} else {
		console.log("Database updated successfully:", data);
	}
}
