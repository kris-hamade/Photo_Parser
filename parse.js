var ExifImage = require('exif').ExifImage;
const superagent = require('superagent');
const dotenv = require('dotenv');
dotenv.config();

var fs = require('fs');
const photoPath = process.env.DEVPHOTOPATH
var files = fs.readdirSync(photoPath);



const geoNamesUsername = process.env.GEONAMESUSERNAME

geocoder.selectProvider("geonames", {
    "username": `${geoNamesUsername}`
})

var photoData = []

//Function To Convert
function ConvertDMSToDD(degrees, minutes, seconds, direction) {
    var dd = degrees + minutes / 60 + seconds / (60 * 60);

    if (direction == "S" || direction == "W") {
        dd = dd * -1;
    } // Don't do anything for N or E
    return dd;
}

const parsePhotos = async () => new Promise((resolve, reject) => {
    files.forEach(file => {

        if (file === '.DS_Store') {
            console.log("Excluding .DS_Store File")
        } else {
            try {
                new ExifImage({
                    image: `${photoPath}/${file}`
                }, function (error, exifData) {
                    if (error)
                        console.log('Error: ' + error.message);
                    else {

                        //Prints Pictures EXIF Data
                        //console.log(exifData);

                        var exifLatitudeDecimal = ConvertDMSToDD(exifData.gps.GPSLatitude[0], exifData.gps.GPSLatitude[1], exifData.gps.GPSLatitude[2], exifData.gps.GPSLatitudeRef);
                        var exifLongitudeDecimal = ConvertDMSToDD(exifData.gps.GPSLongitude[0], exifData.gps.GPSLongitude[1], exifData.gps.GPSLongitude[2], exifData.gps.GPSLongitudeRef);

                        console.log("Latitude " + exifLatitudeDecimal)
                        console.log("Longitude " + exifLongitudeDecimal)

                        superagent
                            .post(`http://api.geonames.org/findNearbyPlaceNameJSON?lat=${exifLatitudeDecimal}&lng=${exifLongitudeDecimal}&username=${geoNamesUsername}`)
                            .then(response => {
                                currentPhotosData = response.body.geonames.forEach((item, index) => {
                                    photoData.push({
                                        photoFileNameCurrent: file,
                                        latitude: item.lat,
                                        longitude: item.length,
                                        distance: item.distance,
                                        cityName: item.name,
                                        stateName: item.adminName1,
                                        stateCode: item.adminCode1,
                                        countryName: item.countryName,
                                        countryCode: item.countryCode,
                                        population: item.population,
                                        imageData: exifData.image,
                                    })
                                })
                                console.log(photoData)

                            }).catch(error => {
                                console.log("There was an error: ", error)
                            }).finally(resolve)
                    }
                });
            } catch (error) {
                console.log('Error: ' + error.message);
            }
        }
    })
})

const logPhotoData = async () => {}

const runProgram = async () => {
    await parsePhotos()
    await logPhotoData()
}
runProgram()