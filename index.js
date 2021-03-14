const express = require('express');
const app = express();
const https = require('https');
const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');
const mysql = require('mysql');
const parse = require('csv-parse');
const bodyParser = require('body-parser');


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
};

const secrets = require('./secrets');

var con = mysql.createConnection({
    host: 'localhost',
    user: 'runkeeper',
    password: secrets.db_rk_password,
    database: 'runkeeper'
});
con.connect();

app.set('view engine', 'pug');
app.use(express.text());

app.use(function (req, res, next) {
  res.set('Access-Control-Allow-Origin', '*');
  next();
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.post('/update', (req, res) => {
    console.log("post update "+req.body);
    const file = fs.createWriteStream("tmp.zip");
    var request = https.get(req.body, function(response) {
        if(response.statusCode == 200 ) {
            response.pipe(file);
            file.on('finish', function() {
                file.close(function() {
                    try {
                        var zip = new AdmZip("tmp.zip");
                        zip.extractAllToAsync("tmp", true, function(error) {
                            if(error) {
                                res.status(400).send("Not able to unzip archive: "+error);
                            } else {
                                update();
                                res.status(200).send("Activities updated");
                            }
                        })
                    } catch(error) {
                        res.status(400).send("Not able to unzip archive: "+error);
                    }
                });
            });
        }
        else {
            fs.unlink("tmp.zip", () => {});
            res.status(400).send("Not able to download archive");
        }
    });
});

app.post("/gpx", (req, res) => {
    console.log("post /gpx");
    let ids = req.body.ids;
    con.query( "select * from gpx where id IN ("+ con.escape(ids)+")", function(err, result) {
        if(err) throw err;
        res.status(200).send(result);
    })
});

app.get("/", (req, res) => {
    con.query("SELECT * FROM activities;", function(err, result) {
        if(err) throw err;
        res.render("template", {data: result, mapbox_token: secrets.mapbox_token});
    });
    console.log("get /");
});

app.get("/main.js", (req, res) => {
    res.sendFile(path.join(__dirname + '/main.js'));
    console.log("get /main.js");
});
app.get("/assets/clock.svg", (req, res) => {
    res.sendFile(path.join(__dirname + '/assets/clock.svg'));
    console.log("get /assets/clock.svg");
});
app.get("/assets/geo-alt-fill.svg", (req, res) => {
    res.sendFile(path.join(__dirname + '/assets/geo-alt-fill.svg'));
    console.log("get /assets/geo-alt-fill.svg");
});
app.get("/assets/speedometer.svg", (req, res) => {
    res.sendFile(path.join(__dirname + '/assets/speedometer.svg'));
    console.log("get /assets/speedometer.svg");
});
app.get("/assets/droplet-fill.svg", (req, res) => {
    res.sendFile(path.join(__dirname + '/assets/droplet-fill.svg'));
    console.log("get /assets/droplet-fill.svg");
});
app.get("/node_modules/gpxparser/dist/GPXParser.min.js", (req, res) => {
    res.sendFile(path.join(__dirname + '/node_modules/gpxparser/dist/GPXParser.min.js'));
    console.log("get /node_modules/gpxparser/dist/GPXParser.min.js");
});
app.get("/js/polyfit.js/index.js", (req, res) => {
    res.sendFile(path.join(__dirname + '/js/polyfit.js/index.js'));
    console.log("get /js/polyfit.js/index.js");
});

app.listen(8085, () => {
    console.log("Serveur à l'écoute sur le port 8085");
})

function update() {
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
            });
        }));
        fs.readFile(path.join("tmp", "cardioActivities.csv"), 'utf8', function(err, data) {
            parse(data, {columns: true}, function(err, rows) {
                rows.forEach(function(row) {
                    // console.log(row);
                    var keys = [], values = [];
                    Object.keys(rkCsv).forEach(function(k) {
                        if( k in row && row[k] ) {
                            keys.push(rkCsv[k]);
                            if( k == "Duration" || k == "Average Pace" ) {
                                let haveHour = row[k].split(':').length == 3;
                                if( !haveHour )
                                    values.push("00:"+row[k]);
                                else
                                    values.push(row[k]);
                            }
                            else
                                values.push(row[k]);
                        }
                    });
                    if( "GPX File" in row && row["GPX File"] ) {
                        con.query("SELECT id FROM gpx WHERE name = ?", [row["GPX File"]], function(err, result) {
                            if(err) throw err;
                            if( result && result.length > 0 ) {
                                keys.push("gpx");
                                values.push(result[0].id);
                            }
                            insertActivity(con, keys, values)
                        });
                    }
                    else {
                        insertActivity(con, keys, values);
                    }
                });
            });
        });
    });
    // fs.unlink("tmp.zip", () => {});
    // fs.rmdir("tmp", {recursive: true}, () => {});
}

function insertActivity(con, keys, values) {
    con.query("INSERT INTO activities ("+keys.join(", ")+") VALUES (?)", [values], function(err, result) {
        if(err) {
            if(err.errno != 1062) throw err;
            return;
        }
    })
}
