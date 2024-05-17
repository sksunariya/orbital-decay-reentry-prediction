function jdayInternal(year, mon, day, hr, minute, sec, msec = 0) {
    return (
      ((367.0 * year) - Math.floor((7 * (year + Math.floor((mon + 9) / 12.0))) * 0.25))
      + Math.floor((275 * mon) / 9.0)
      + day + 1721013.5
      + (((((msec / 60000) + (sec / 60.0) + minute) / 60.0) + hr) / 24.0) 
    );
}

exports.jday = (year, mon, day, hr, minute, sec, msec) => {
    if (year instanceof Date) {
      const date = year;
      return jdayInternal(
        date.getUTCFullYear(),
        date.getUTCMonth() + 1, 
        date.getUTCDate(),
        date.getUTCHours(),
        date.getUTCMinutes(),
        date.getUTCSeconds(),
        date.getUTCMilliseconds(),
      );
    }
  
    return jdayInternal(year, mon, day, hr, minute, sec, msec);
}

//   let jdate = jday(new Date());
//   console.log("jday: ", jdate);





// // other way to calculate julian day from javascript date

// var date = new Date();     // a new date
// var time = date.getTime(); // the timestamp, not neccessarely using UTC as current time
// var julian_day = (time / 86400000) - (date.getTimezoneOffset()/1440) + 2440587.5;
// console.log("julian_day: ", julian_day);




exports.julianToDate = (julianDate) => {
    
    var j = julianDate + 0.5;
    var z = Math.floor(j);
    var f = j - z;

    if (z < 2299161) {
        var a = z;
    } else {
        var alpha = Math.floor((z - 1867216.25) / 36524.25);
        var a = z + 1 + alpha - Math.floor(alpha / 4);
    }

    var b = a + 1524;
    var c = Math.floor((b - 122.1) / 365.25);
    var d = Math.floor(365.25 * c);
    var e = Math.floor((b - d) / 30.6001);

    var day = b - d - Math.floor(30.6001 * e) + f;
    var month = (e < 14) ? e - 1 : e - 13;
    var year = (month > 2) ? c - 4716 : c - 4715;

    // Convert Julian Date to JavaScript Date Object
    var dateObj = new Date(Date.UTC(year, month - 1, Math.floor(day)));
    
    // Convert Julian Time to JavaScript Time
    var timeFraction = day % 1;
    var millisecondsInDay = 24 * 60 * 60 * 1000;
    var milliseconds = Math.round(timeFraction * millisecondsInDay);
    dateObj.setUTCHours(0, 0, 0, milliseconds);
    
    return dateObj;
}




exports.TLEEpochToJSDate = (tleEpoch) => {
    // Parse TLE Epoch
    var yearLastDigits = parseInt(tleEpoch.substring(0, 2))
    var year = yearLastDigits > 56 ? 1900 : 2000;
    year += yearLastDigits;

    var dayOfYear = parseFloat(tleEpoch.substring(2, 5));
    var fractionOfDay = parseFloat("0." + tleEpoch.substring(6));

    // console.log("dayofYear: ", dayOfYear, ", fractionday: ", fractionOfDay);

    // Calculate date components
    var jan1st = new Date(year, 0, 1); // January 1st of the given year
    var millisecondsInDay = 24 * 60 * 60 * 1000;
    var millisecondsSinceJan1st = Math.floor((dayOfYear - 1) * millisecondsInDay + fractionOfDay * millisecondsInDay);

    // Create JavaScript Date object
    var jsDate = new Date(jan1st.getTime() + millisecondsSinceJan1st);

    return jsDate;
}