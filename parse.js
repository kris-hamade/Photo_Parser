var ExifImage = require('exif').ExifImage;
const superagent = require('superagent');
const dotenv = require('dotenv');
dotenv.config();
var fs = require('fs');
const photoPath = process.env.DEVPHOTOPATH
var files = fs.readdirSync(photoPath);

var photoData = []

const geoNamesUsername = process.env.GEONAMESUSERNAME



//Function To Convert
function ConvertDMSToDD(degrees, minutes, seconds, direction) {
    var dd = degrees + minutes / 60 + seconds / (60 * 60);

    if (direction == "S" || direction == "W") {
        dd = dd * -1;
    } // Don't do anything for N or E
    return dd;
}


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

                    /* console.log("Latitude " + exifLatitudeDecimal)
                    console.log("Longitude " + exifLongitudeDecimal) */

                    queryGeoName(file, exifData, exifLatitudeDecimal, exifLongitudeDecimal)
                }
            });

        } catch (error) {
            console.log('Error: ' + error.message);
        }
    }
})


const queryGeoName = (file, exifData, exifLatitudeDecimal, exifLongitudeDecimal) => new Promise((resolve, reject) => {
    superagent
        .post(`http://api.geonames.org/findNearbyPlaceNameJSON?lat=${exifLatitudeDecimal}&lng=${exifLongitudeDecimal}&username=${geoNamesUsername}`)
        .then(response => {
            if (response.body.geonames !== undefined) {
                response.body.geonames.forEach((item, index) => {
                    delete exifData.image['XPComment']
                    delete exifData.image['XPKeywords']

                    var dateTaken = exifData.image.ModifyDate.replace(/ /g, "-").replace(/:/g, '')
                    /*                 photoData[index] = {
                                        photoFileNameCurrent: file,
                                        latitude: item.lat,
                                        longitude: item.lng,
                                        distance: item.distance,
                                        cityName: item.name,
                                        stateName: item.adminName1,
                                        stateCode: item.adminCode1,
                                        countryName: item.countryName,
                                        countryCode: item.countryCode,
                                        population: item.population,
                                        dateTaken: dateTaken,
                                        imageData: exifData.image, 
                                    } */
                    photoData.push({
                        photoFileNameCurrent: file,
                        latitude: item.lat,
                        longitude: item.lng,
                        distance: item.distance,
                        cityName: item.name,
                        stateName: item.adminName1,
                        stateCode: item.adminCode1,
                        countryName: item.countryName,
                        countryCode: item.countryCode,
                        population: item.population,
                        dateTaken: dateTaken,
                        imageData: exifData.image,
                    })
                    renamePhotos()
                })
            }
        }).catch(error => {
            console.log("There was an error: ", error)
        }).finally()
})

const renamePhotos = () => new Promise((resolve, reject) => {
    //console.log(photoData)
    var path = photoPath
    photoData.forEach(photo => {
        console.log(photo)
        let newPhotoPath = photoPath+photo.cityName
        
        if (fs.existsSync(photoPath+photo.cityName)) {
            console.log(photoPath+photo.cityName + " Exists")
            path = newPhotoPath
        }
        else {
            fs.mkdir(`${photoPath+photo.cityName}`, (err) => {
                if (err) throw err
                else {
                console.log(photo.cityName + " Folder Created")
                path = photoPath
                }
              });
        }


        var search = photo.photoFileNameCurrent
        var replace = `${photo.cityName}_${photo.stateCode}_${photo.countryCode}-${photo.dateTaken}.jpg`

        const {join} = require('path');
        const {renameSync} = require('fs');
        const match = RegExp(search, 'g');
        console.log("New Path is " + path)

        files
            .filter(file => file.match(match))
            .forEach(file => {
                try {
                    const filePath = join(photoPath, file);
                    const newFilePath = join(photoPath, file.replace(match, replace));

                    renameSync(filePath, newFilePath);
                } catch (error) {
                    console.log('Error: ' + error.message);
                }
            });

    })
})

const organizePhotos = new Promise((resolve, reject) => {

})

const runProgram = async () => {

}
runProgram()