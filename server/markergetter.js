// markergetter.js
import supabase from './supabaseClient.js'

console.log("test from mgjs")
const gettingCoords = async () => { //fetchOrders
	try {
		let { data: markers1, error } = await supabase
		.from('markers1')
		.select('coordinate_x, coordinate_y, type, creator, status')

		if (error) {
			console.error(error);
			return;
		}
		
		if (markers1) {
			console.log('got data from supa') 
			console.log(markers1);
		}
	
		// array containing data from markers1 table
		const dataArr = markers1.map(row => { 
			return {corx: row.coordinate_x, cory: row.coordinate_y, bintype: row.type, name: row.creator, stts: row.status};
		});

		return dataArr;

	} catch (error) {
  		console.log(error);
	}
}

export { gettingCoords };
console.log('markgetterend')