const satlib = require('satellite.js');
const generateTLE = require('./generateTLE');
const {TLEEpochToJSDate, julianToDate, jday} = require("./convertDateFormat");



// Constants
const G = 6.67430e-11; // Gravitational constant in m^3 kg^-1 s^-2
const M = 5.972e24;    // Earth's mass in kg
const Cd = 2.2;        // Drag coefficient
const A = 20;          // Cross-sectional area in m^2 (assumed)
const m = 1000;        // Satellite mass in kg
const CR = 1.3;        // Radiation pressure coefficient
const P = 4.56e-6;     // Solar radiation pressure at Earth in N/m^2
const AU = 1.496e11;   // Astronomical unit in meters

const altitudeThreshold = 150; // in km

// Initial TLE parameters (ISS)
let meanMotion = 15.542; // Mean motion in rev/day
let altitude = 408e3;    // Approximate altitude in meters

// Convert mean motion to rad/s
let omega = meanMotion * 2 * Math.PI / 86400;

// Calculate initial orbital radius and velocity
let r = altitude + 6371e3; // Earth radius + altitude
let v = omega * r;

// console.log("r: " + r + ", v: " + v);

// Time step in seconds
let dt = 10;

// Calculate atmospheric density
function getDensity(h) {
    const rho0 = 1.225; // kg/m^3
    const H = 8800;     // m
    return rho0 * Math.exp(-(h) / H);
}

function multiplyScalar(vec, k) {
    return {
        x : vec.x * k,
        y : vec.y * k,
        z : vec.z * k
    }
}


let initialTLE = 
`1 25544U 98067A   22097.38965280  .00000580  00000-0  19520-4 0  9994
2 25544  51.6448 332.0653 0003090  91.8233  85.9339 15.48953106316992`

console.log("");
console.log("Initial TLE: ");
console.log(initialTLE);


let satrec = satlib.twoline2satrec(
    initialTLE.split('\n')[0].trim(), 
    initialTLE.split('\n')[1].trim()
);


let satelliteNumber = initialTLE.substring(2,7);
let classification = initialTLE.substring(7,8);
let internationalDesignator = initialTLE.substring(9,15);
let revolutionNumber = '31699';

let epochTime = initialTLE.substring(18,32);
let currentTimejs = TLEEpochToJSDate(epochTime);

// Simulation loop for k days
let k = 100;
for (let t = 0; t <= k * 86400; t += dt) {
    let rho = getDensity(altitude);
    let Fd = 0.5 * Cd * rho * v * v * A;
    let ad = Fd / m;

    let Fsr = CR * P * A * Math.pow(AU / (AU + altitude), 2);
    let asr = Fsr / m;

    // Update velocity and position
    let a = ad + asr;
    v -= a * dt;
    r -= (0.5 * (((G * M)/(r*r)) - ((v*v)/r)) * dt*dt);
    altitude = r - 6371e3;

    // Update mean motion
    omega = v / r;   // angular velocity
    meanMotion = omega * 86400 / (2 * Math.PI);

    //if (t % 3600 == 0) console.log("rho: ", rho, ", ad: ", ad, ", asr: " , asr, ", a: ", a, " vi: " , vi, " ri: " , ri, ", v: ", v, ", r: ", r, ", altitude: " , altitude);


        
    satrec = satlib.twoline2satrec(
        initialTLE.split('\n')[0].trim(), 
        initialTLE.split('\n')[1].trim()
    );

    epochTime = initialTLE.substring(18,32);


    currentTimejs = TLEEpochToJSDate(epochTime);
    let currentTimejulian = ((jday(currentTimejs) * 86400) + dt) / 86400; // converting js date to julian and adding 10 seconds
    let currentTime = julianToDate(currentTimejulian); // converting julian to js date
    currentTimejs = currentTime;

    const positionAndVelocity = satlib.propagate(satrec, currentTime);
    const positionEci = positionAndVelocity.position;
    const gmst = satlib.gstime(currentTime); // Greenwich Mean Sidereal Time


    // Convert ECI position to Geodetic coordinates (latitude, longitude, altitude)
    const positionGd = satlib.eciToGeodetic(positionEci, gmst);

    // console.log("positionGd: ", positionGd);

    let acc = multiplyScalar(positionAndVelocity.position, -1 * ((((G * M)/(r*r)) - ((v*v)/r)) * (1/r)));

    let inititalPos = positionAndVelocity.position;
    let initialVel = positionAndVelocity.velocity;

    let finalPosition = {
        x : inititalPos.x + (initialVel.x * dt) + (0.5 * acc.x * dt * dt),
        y : inititalPos.y + (initialVel.y * dt) + (0.5 * acc.y * dt * dt),
        z : inititalPos.z + (initialVel.z * dt) + (0.5 * acc.z * dt * dt)
    }

    let finalVelocity = {
        x : initialVel.x + (acc.x * dt),
        y : initialVel.y + (acc.y * dt),
        z : initialVel.z + (acc.z * dt),
    }
    
    // console.log("initial TLE unmodified: ");
    // console.log(initialTLE);

    let currentDate = currentTime;

    initialTLE = generateTLE(finalPosition, finalVelocity, currentDate, satelliteNumber, classification, internationalDesignator, revolutionNumber); // currentDate is js date

    // console.log("initial TLE modified: ");
    // console.log(initialTLE);


    // Check if altitude falls below threshold
    if (positionGd.height < altitudeThreshold) {
        console.log(`Reentry detected at: ${currentTime}`);
        console.log(`Reentry location: Latitude ${positionGd.latitude.toFixed(2)}°, Longitude ${positionGd.longitude.toFixed(2)}°`);
        break;
    }

    // Print hourly updates
    if (t % 3600 === 0 ) {
        console.log("");
        console.log(`Time: ${t/3600} hr `, currentTime);
        console.log("positionGd: " , positionGd);
        console.log("Modified TLE: ");
        console.log(initialTLE);
        console.log(" ");
        console.log(`Time: ${t/3600} hr, Altitude: ${altitude.toFixed(2)/1000} km`);
    }
    
}

