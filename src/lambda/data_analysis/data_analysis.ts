import * as dfd from "danfojs-node";
import { z } from "zod";
import data from "./census_data.json" 
import devices from "./groups.json"
import RBush from 'rbush';
import * as turf from '@turf/turf';


export async function main(event: any) {
    try {
        // console.log(event);
        const {age, income} = payloadValidation(event);

        console.log(age, income);

        let df = prepareDataFrame(data);
        df = normalizeColumns(df, ["age", "income", "population"]);
        df = calculateDifferences(df, age, income); 
        df = calculateAbsPosition(df);
        df = normalizeAndSort(df);
        // df.print();

       const deviceList = extractDevicesData(df, devices);
       console.log(deviceList);

        let res =  createResponse(200, "Success", df, deviceList);
        // console.log(res);
        // df.print();

        return res;

    } catch (e: any) {
        let res = createResponse(500, e.message || e, 'any', []);
        // console.log(res)
        return res;
    }
}

function prepareDataFrame(data: any) {
    let rows = [];
    for (let feature of data.features) {
        let row = prepareRow(feature);
        if (row !== null) {
            rows.push(row);
        }
    }
    return new dfd.DataFrame(rows);
}

function prepareRow(feature: any) {
    let properties = feature.properties;
    let age = properties['v_CA21_389: Average age'];
    let income = properties['v_CA21_560: Median total income in 2020 among recipients ($)'];
    let population = properties['Population'];
    let area = properties['Area (sq km)'];
    
    // Check if geometry and coordinates are defined
    let coords;
    if (feature.geometry && feature.geometry.coordinates && feature.geometry.coordinates[0] && feature.geometry.coordinates[0][0]) {
        coords = feature.geometry.coordinates[0][0];
    } else {
        console.log(`Coordinates not found for feature: ${JSON.stringify(feature)}`);
        return null;
    }

    if (age !== null && population !== null && income !== null && area !== null) {
        let density = population / area;
        return { age, income, density, population, coords };
    }
    return null;
}


function normalizeColumns(df: any, cols_to_normalize: string[]) {
    cols_to_normalize.forEach(col => {
        let newValue = col + "_normalized";
        const max_value = df[col].max();
        const min_value = df[col].min();
        const normalized_col = df[col].sub(min_value).div(max_value - min_value);
        df.addColumn(newValue, normalized_col, { inplace: true });
    });
    return df;
}

function calculateDifferences(df: any, desired_age: number, desired_income: number) {
    df.addColumn('age_difference', df['age_normalized'].sub(desired_age).abs(), { inplace: true });
    df.addColumn('income_difference', df['income_normalized'].sub(desired_income).abs(), { inplace: true });
    return df;
}

function calculateAbsPosition(df: any) {
    df.addColumn('abs_position', df['age_difference'].add(df['income_difference']), { inplace: true });
    return df;
}

function normalizeAndSort(df: any) {
    const max_abs_position = df['abs_position'].max();
    const min_abs_position = df['abs_position'].min();
    df.addColumn('normalized_abs_position', df['abs_position'].sub(min_abs_position).div(max_abs_position - min_abs_position), { inplace: true });
    df.sortValues("normalized_abs_position", { ascending: true, inplace: true });
    return df;
}

function createResponse(statusCode: number, message: string, df: any, deviceList: []) {
    const dataObject = {
      message,
      data: df.values,
      devices: deviceList
    };
  
    return {
      statusCode,
      body: JSON.stringify(dataObject)
    };
  }
function payloadValidation (event: any) {

    const payloadSchema = z.object({
        age: z.number(),
        income: z.number(),
    });

    return payloadSchema.parse(
        JSON.parse(event.body || JSON.stringify({}))
      );
}

// Define the type for the data we'll put into the R-tree
interface RBushItem {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
    id: number;
  }
  
  function extractDevicesData(df: any, devices: any[]) {
    if(!df || !df['coords']) {
        console.log("Data frame or Coords column is undefined");
        return df;
    }

    const deviceList = [];

    const rtree = new RBush<RBushItem>();

    // Create and load R-tree with bounding boxes for polygons
    df.values.forEach((value: any, index: number) => {
        try {
            const polygon = turf.polygon([value[4]]);
            const bbox = turf.bbox(polygon);
            const item: RBushItem = {minX: bbox[0], minY: bbox[1], maxX: bbox[2], maxY: bbox[3], id: index};
            rtree.insert(item);
        } catch (error) {
            console.error(`Error at index ${index}:`, error);
        }
    });

    // Filter devices to only those with defined lat, long, and id
    const validDevices = devices.filter(device => device.lat && device.long && device.id);

    for (const device of validDevices) {
        const {name, lat, long, id, address, city, postalCode } = device;

        const devicesSimplified = {
            "name": name,
            "lat": lat,
            "long": long,
            "city": city,
            "address": address,
            "postalCode": postalCode,
            "id": id,
            "matchID": -1,
            "normalized_abs_position": -1
        }

        const point = turf.point([long, lat]);
        const deviceBbox = turf.bbox(point);

        // Search R-tree for intersecting polygons
        const matches: RBushItem[] = rtree.search({minX: deviceBbox[0], minY: deviceBbox[1], maxX: deviceBbox[2], maxY: deviceBbox[3]});

        for(const match of matches) {
            if(match === undefined){
                continue;
            }
            
            if(df.values[match.id]) {  // Check if df.values[match.id] is not undefined
                const polygonCoords = df.values[match.id][4];
        
                if(polygonCoords === undefined) {
                    continue;
                }
                
                const polygon = turf.polygon([polygonCoords]);
        
                if(turf.booleanPointInPolygon(point, polygon)) {
                    // Point is in polygon, add id to row
                    devicesSimplified.matchID = match.id;
                    devicesSimplified.normalized_abs_position = df.values[match.id][11];
                    deviceList.push(devicesSimplified);
                }
            }
        }
    }

    // Sort deviceList in descending order of normalized_abs_position
    deviceList.sort((b, a) => b.normalized_abs_position - a.normalized_abs_position);

    return deviceList;
}
