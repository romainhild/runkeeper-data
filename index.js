const express = require('express')
const app = express()
const https = require('https')
const fs = require('fs')
const path = require('path')
const AdmZip = require('adm-zip')
const mysql = require('mysql')
const parse = require('csv-parse')

const rkCsv = {
    "Date": "date",
    "Type": "type",
    "Route Name": "route",
    "Distance (km)": "distance",
    "Duration": "duration",
    "Average Pace": "pace",
    "Average Speed (km/h)": "speed",
    "Calories Burned": "calories",
    "Climb (m)": "climb",
    "Average Heart Rate (bpm)": "heart_rate",
    "Notes": "notes"
}

app.use(express.text())

app.post('/update', (req, res) => {
    const file = fs.createWriteStream("tmp.zip")
    var request = https.get(req.body, function(response) {
        if(response.statusCode == 200 ) {
            response.pipe(file)
            file.on('finish', function() {
                file.close(function() {
                    try {
                        var zip = new AdmZip("tmp.zip")
                        zip.extractAllToAsync("tmp", true, function(error) {
                            if(error) {
                                res.status(400).send("Not able to unzip archive: "+error)
                            } else {
                                update()
                                res.status(200).send("Activities updated")
                            }
                        })
                    } catch(error) {
                        res.status(400).send("Not able to unzip archive: "+error)
                    }
                })
            })
        }
        else {
            fs.unlink("tmp.zip", () => {})
            res.status(400).send("Not able to download archive")
        }
    })
})

app.get("/", (req, res) => {
    res.status(200).send("Ok")
    console.log("get /")
})

app.listen(8085, () => {
    console.log("Serveur à l'écoute sur le port 8085")
})

function update() {
    console.log("update")
    var con = mysql.createConnection({
        host: 'localhost',
        user: 'runkeeper',
        password: process.env.DB_RK_PASS,
        database: 'runkeeper'
    })
    con.connect(function(err) {
        if(err) throw err
        console.log("connected")
        fs.readdir("tmp", function(err, files) {
            if(err) {
                return console.log(err);
            }
            const gpxFiles = files.filter(el => path.extname(el) === '.gpx').forEach(el => fs.readFile(path.join("tmp", el), 'utf8', function(err, data) {
                if(err) {
                    return console.log(err);
                }
                con.query("INSERT INTO gpx (data, name) VALUES (?, ?)", [data, el], function(err, result) {
                    if(err) {
                        if(err.errno != 1062) throw err;
                        return;
                    }
                    console.log(result);
                })
            }))
            fs.readFile(path.join("tmp", "cardioActivities.csv"), 'utf8', function(err, data) {
                parse(data, {columns: true}, function(err, rows) {
                    rows.forEach(function(row) {
                        // console.log(row)
                        var keys = [], values = []
                        Object.keys(rkCsv).forEach(function(k) {
                            if( k in row && row[k] ) {
                                keys.push(rkCsv[k])
                                values.push(row[k])
                            }
                        })
                        if( "GPX File" in row && row["GPX File"] ) {
                            con.query("SELECT id FROM gpx WHERE name = ?", [row["GPX File"]], function(err, result) {
                                if(err) throw err;
                                if( result && result.length > 0 ) {
                                    keys.push("gpx")
                                    values.push(result[0].id)
                                }
                                insertActivity(con, keys, values)
                            })
                        }
                        else {
                            insertActivity(con, keys, values)
                        }
                    })
                })
            })
        })
    })
    // fs.unlink("tmp.zip", () => {})
    // fs.rmdir("tmp", {recursive: true}, () => {})
}

function insertActivity(con, keys, values) {
    con.query("INSERT INTO activities ("+keys.join(", ")+") VALUES (?)", [values], function(err, result) {
        if(err) {
            if(err.errno != 1062) throw err;
            return;
        }
        console.log(result);
    })
}
