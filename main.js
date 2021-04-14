function formatDuration(d, precision=9) {
    var s = "";
    if( (years = d.years()) > 0 && precision > 0 ) {
        precision--;
        s = s + " " + moment.duration({years: years}).humanize();
    }
    if( (months = d.months()) > 0 && precision > 0 ) {
        precision--;
        s = s + " " + moment.duration({months: months}).humanize();
    }
    if( (days = d.days()) > 0 && precision > 0 ) {
        precision--;
        s = s + " " + moment.duration({days: days}).humanize();
    }
    if( (hours = d.hours()) > 0 && precision > 0 ) {
        precision--;
        s = s + " " + moment.duration({hours: hours}).humanize();
    }
    if( (minutes = d.minutes()) > 0 && precision > 0 ) {
        precision--;
        s = s + " " + moment.duration({minutes: minutes}).humanize();
    }
    if( (seconds = d.seconds()) > 0 && precision > 0 ) {
        precision--;
        s = s + " " + moment.duration({seconds: seconds}).humanize();
    }
    if( (milliseconds = d.milliseconds()) > 0 && precision > 0 ) {
        precision--;
        s = s + " " + moment.duration({milliseconds: milliseconds}).humanize();
    }
    return s.trim();
}

function updateCards(eventData) {
    var dff = df;
    var range = [];
    if( 'xaxis.range' in eventData )
        range = eventData['xaxis.range'];
    if( 'xaxis.range[0]' in eventData && 'xaxis.range[1]' in eventData ) {
        range.push(eventData['xaxis.range[0]']);
        range.push(eventData['xaxis.range[1]']);
    }
    if( range.length > 0 )
        dff = df.where(row => row.get('date') > range[0] && row.get('date') < range[1]);

    let r = getCardsLabels(dff);
    document.getElementById("cardDistance").innerHTML = r['distance'];
    document.getElementById("cardCalories").innerHTML = r['calories'];
    document.getElementById("cardDuration").innerHTML = r['duration'];
    document.getElementById("cardSpeed").innerHTML = r['speed'];
}

function getCardsLabels(dff) {
    var r = {}
    let distance = dff.reduce((p,n) => p+n.get('distance'), 0);
    r['distance'] = distance.toFixed(2)+" km";
    let cal = dff.reduce((p,n) => p+n.get('calories'), 0);
    r["calories"] = cal+" kcal";
    let duration = dff.reduce((p,n) => p.add(moment.duration({hours:n.get('duration').split(':')[0],
                                                              minutes:n.get('duration').split(':')[1],
                                                              seconds:n.get('duration').split(':')[2]}
                                                            )), moment.duration(0));
    r["duration"] = formatDuration(duration, 2);
    let speed = dff.reduce((p,n) => p + n.get('speed'), 0)/dff.count();
    r["speed"] = speed.toFixed(2)+ "km/h";
    return r;
}

function movingAvg(array, count, isTime) {
    var r = [], i;
    var arr = array;
    if( isTime )
        arr = array.map(x => moment(x).unix());
    for(i = 0; i < arr.length - count+1; i++) {
        var a = 0, j;
        for(j = 0; j < count; j++)
            a = a + arr[i+j];
        r.push(a/count);
    }
    if( isTime )
        return r.map(x => moment.unix(x).utc().format());
    return r;
}

function movingSpeed(cumul, times) {
    let r = times.map(function(tTrack, iTrack) {
        let timesT = tTrack;
        let cumulT = cumul[iTrack];
        return timesT.map(function(tn, i) {
            if( i == 0 && i+1 < cumulT.length ) {
                return cumulT[1]/timesT[1].diff(tn)*3600;
            } else if( i == cumulT.length-1 && i-1 >= 0 ) {
                return (cumulT[i]-cumulT[i-1])/tn.diff(timesT[i-1])*3600
            } else {
                return (cumulT[i+1]-cumulT[i-1])/timesT[i+1].diff(timesT[i-1])*3600;
            }
        });
    });
    return r;
}

function statChange(stat) {
    let by = document.querySelector('input[name="StatBy"]:checked')?.value;
    let avg = document.getElementById("rangeAvg").value;
    plotGraph(stat, by, avg);
}

function byChange(by) {
    let stat = document.querySelector('input[name="Statistiques"]:checked')?.value;
    let avg = document.getElementById("rangeAvg").value;
    avgLabel(periods[by]['label'], avg);
    plotGraph(stat, by, avg);
}

function rangeChange(avg) {
    let stat = document.querySelector('input[name="Statistiques"]:checked')?.value;
    let by = document.querySelector('input[name="StatBy"]:checked')?.value;
    plotGraph(stat, by, avg);
}

function rangeInput(avg) {
    let by = document.querySelector('input[name="StatBy"]:checked')?.value;
    avgLabel(periods[by]['label'], avg);
}

function avgLabel(by, avg) {
    if( avg > 1 && !by.endsWith('s') ) {
        by = by + 's';
    }
    document.getElementById("labelAvg").innerHTML = "Moyenne sur " + avg + " " + by;
}

function aggregate(group, stat, type) {
    if( stat == "pace" || stat == "duration" ) {
        let sum = group.reduce((p, n) => p.add(moment.duration({hours:n.get(stat).split(':')[0], minutes:n.get(stat).split(':')[1], seconds:n.get(stat).split(':')[2]})), moment.duration(0)).asSeconds();
        if( type == "mean" ) {
            return sum/group.count();
        } else {
            return sum;
        }
    } else {
        if( type == "mean" ) {
            return group.stat.mean(stat);
        } else {
            return group.stat.sum(stat);
        }
    }
}

function plotGraph(typeStat, by, avg) {
    const splits = typeStat.split('_');
    const type = splits[0];
    const stat = splits[1];

    var selectorOptions = {
        buttons: [{step: 'month', stepmode: 'backward', count: 1, label: '1m'},
                  {step: 'month', stepmode: 'backward', count: 6, label: '6m'},
                  {step: 'year', stepmode: 'todate', count: 1, label: 'YTD'},
                  {step: 'year', stepmode: 'backward', count: 1, label: '1y'},
                  {step: 'all'}]
    };
    var layout = {
        showlegend:false,
        title:stats[stat]['label'],
        hovermode: 'x unified',
        xaxis: {
            rangeselector: selectorOptions,
            rangeslider: {},
            hoverformat: periods[by]['text'],
        },
        yaxis: {
            fixedrange: true,
            title: stats[stat]['unit']
        }
    };

    dff = df.groupBy(by).aggregate(group => aggregate(group, stat, type));
    var hoverformat = stats[stat]['type'] == 'float' ? '%{y:.2f}' : '%{y:d}';
    var customdata = []
    var isTime = false;
    if( stats[stat]['type'] == 'time' ) {
        let max = dff.reduce((p,n) => Math.max(p, n.get('aggregation')), 0);
        if( max > 3600*24 ) {
            let customdataDf = dff.chain(
                row => row.set('duration', moment.duration({seconds: row.get('aggregation')})),
                row => row.set('days', row.get('duration').days()),
                row => row.set('hours', row.get('duration').hours()),
                row => row.set('minutes', row.get('duration').minutes()),
                row => row.set('seconds', row.get('duration').seconds())
            );
            customdata = customdataDf.drop('aggregation').drop(by).drop('duration').toArray()
            dff = dff.map(row => row.set('aggregation', moment.duration({seconds:row.get('aggregation')}).asHours()));
            layout['yaxis']['title'] = "h";
            hoverformat = '%{customdata[0]}j %{customdata[1]}h %{customdata[2]}m %{customdata[3]}s';
        }
        else if( max > 3600 ) {
            isTime = true;
            dff = dff.map(row => row.set('aggregation', moment.unix(row.get('aggregation')).utc().format()));
            layout['yaxis']['tickformat'] = '%H:%M:%S';
            hoverformat = '%{y|%H:%M:%S}';
        }
        else {
            isTime = true;
            dff = dff.map(row => row.set('aggregation', moment.unix(row.get('aggregation')).utc().format()));
            layout['yaxis']['tickformat'] = '%M:%S';
            hoverformat = '%{y|%M:%S}';
        }
    }
    let y = dff.toArray("aggregation");
    let plot = [{
        x: dff.toArray(by),
        y: y,
        type: 'bar',
        hovertemplate: stats[stat]['label'] + ': ' + hoverformat + ' ' + stats[stat]['unit'],
        customdata: customdata,
        hoverlabel: {namelength:0}
    }];
    if( avg > 1 ) {
        var byL = periods[by]['label'];
        if( !byL.endsWith('s') ) {
            byL = byL + 's';
        }
        if( stats[stat]['type'] == 'int' )
            hoverformat = '%{y:.2f}';
        plot.push({
            x:dff.sortBy(by).slice(avg-1).toArray(by),
            y:movingAvg(dff.sortBy(by).toArray("aggregation"), avg, isTime),
            type: 'lines',
            hovertemplate: 'Moyenne sur '+avg+' '+byL + ': ' + hoverformat + ' ' + stats[stat]['unit'],
            hoverlabel: {namelength:0}
        });
    }
    let config = {locale: 'fr', responsive: true};
    Plotly.newPlot("test", plot, layout, config );
    document.getElementById("test").on('plotly_relayout', updateCards);
}

function rankFormatter(value, row, index) {
    return index+1;
}

function dateFormatter(value) {
    return moment(value).utc().format('LLLL');
}

function paceFormatter(value) {
    let pace = moment.duration(value);
    return String(pace.minutes()).padStart(2, '0')+':'+String(pace.seconds()).padStart(2, '0')+' min/km';
}

function durationFormatter(value) {
    return formatDuration(moment.duration(value));
}

function distGeo(lat1, lon1, lat2, lon2) {
    const R = 6371e3;
    const phi1 = lat1 * Math.PI/180;
    const phi2 = lat2 * Math.PI/180;
    // var deltaPhi = 0;
    var deltaPhi = (lat2-lat1) * Math.PI/180;
    var deltaLambda = (lon2-lon1) * Math.PI/180;
    var a = Math.sin(deltaPhi/2) * Math.sin(deltaLambda/2) +
        Math.cos(phi1) * Math.cos(phi1) *
        Math.sin(deltaPhi/2) * Math.sin(deltaLambda/2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const dx = R*c;
    return {dx: dx, dy:dx};

    // deltaPhi = (lat2-lat1) * Math.PI/180;
    // deltaLambda = 0;
    // a = Math.sin(deltaPhi/2) * Math.sin(deltaLambda/2) +
    //     Math.cos(phi1) * Math.cos(phi2) *
    //     Math.sin(deltaPhi/2) * Math.sin(deltaLambda/2);
    // c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    // const dy = R*c;
    return {dx: dx, dy:dy};
}

function zoomCenter(bounds) {
    let dxdy = distGeo(bounds.minLat, bounds.minLon, bounds.maxLat, bounds.maxLon);
    let dx = dxdy.dx;
    let dy = dxdy.dy;
    // console.log(dx);
    // console.log(dy);
    // number of pixel on the graph on MY screen !!
    let npx = 800
    let npy = 300
    // meter per pixel at zoom level 0 by latitude
    let mp0 = (x) => 109*Math.pow(x,4)/480000 + 83*Math.pow(x,3)/12000 - 14569*Math.pow(x,2)/1200 + (67*x)/30 + 78271;
    // we fit mp0(lat)/(2**z) meter/pixel at zoom level z and latitude lat
    let zoomx = Math.log2(mp0(bounds.minLat+(bounds.maxLat-bounds.minLat)/2)*npx/dx)
    let zoomy = Math.log2(mp0(bounds.minLat+(bounds.maxLat-bounds.minLat)/2)*npy/dy)
    return {zoom: Math.min(zoomx,zoomy), center: {'lat':bounds.minLat+(bounds.maxLat-bounds.minLat)/2,'lon':bounds.minLon+(bounds.maxLon-bounds.minLon)/2}}
}

function tableButtons() {
    return{
        btnUsersAdd: {
            text: "Plus d'info",
            event: function () {
                modal($('#table').bootstrapTable('getSelections'))
            }
        }
    }
}

function clickCell(field, value, row, element) {
    if( field == 7 ) {
        $('#table').bootstrapTable('uncheckAll')
        modal([row]);
    }
}

function modal(rows) {
    if( rows.length == 0 )
        return;
    dff = new DataFrame(rows);

    var title = dff.count() == 1 ? "Course du " : "Courses du ";
    title = title + dff.toArray('date').map(d => moment(d).format('LLLL')).join(', ');
    document.getElementById("modalTitle").innerHTML = title;
    
    let r = getCardsLabels(dff);
    document.getElementById("cardDistanceModal").innerHTML = r['distance'];
    document.getElementById("cardCaloriesModal").innerHTML = r['calories'];
    document.getElementById("cardDurationModal").innerHTML = r['duration'];
    document.getElementById("cardSpeedModal").innerHTML = r['speed'];

    let gpxIds = dff.dropMissingValues(['gpx']).toArray('gpx');
    if( gpxIds.length > 0 ) {
        $.post(window.location.href+"/gpx", {ids: gpxIds},
               function(data, status){
                   if(status == "success")
                       createModalPlots(dff, data);
               });
    }
    var myModal = new bootstrap.Modal(document.getElementById('activityModal'))
    myModal.show();
}

function createModalPlots(dff, data) {
    // console.log(data);
    let gpxs = {}
    data.forEach(function(d) {
        var gpx = new gpxParser();
        gpx.parse(d.data)
        gpxs[d.id] = gpx;
    });
    dff = dff.withColumn('lon', function(row) {
        if( !row.get('gpx') )
            return;
        let gpx = gpxs[row.get('gpx')];
        let pts = [];
        gpx.tracks.forEach(track => pts.push(track.points.map(pt => pt.lon)));
        return pts;
    });
    dff = dff.withColumn('lat', function(row) {
        if( !row.get('gpx') )
            return;
        let gpx = gpxs[row.get('gpx')];
        let pts = [];
        gpx.tracks.forEach(track => pts.push(track.points.map(pt => pt.lat)));
        return pts;
    });
    dff = dff.withColumn('ele', function(row) {
        if( !row.get('gpx') )
            return;
        let gpx = gpxs[row.get('gpx')];
        let pts = [];
        gpx.tracks.forEach(track => pts.push(track.points.map(pt => pt.ele)));
        return pts;
    });
    dff = dff.withColumn('times', function(row) {
        if( !row.get('gpx') )
            return;
        let gpx = gpxs[row.get('gpx')];
        let pts = [];
        gpx.tracks.forEach(track => pts.push(track.points.map(pt => moment(pt.time))));
        return pts;
    });
    dff = dff.withColumn('cumul_times', function(row) {
        if( !row.get('gpx') )
            return;
        return row.get('times').map(tt => {t0 = tt[0]; return tt.map( t => {t1 = moment.duration(t.diff(t0)); return Math.trunc(t1.asMinutes())+':'+t1.seconds().toString().padStart(2, '0');})});
    });
    dff = dff.withColumn('cumul_dist', function(row) {
        if( !row.get('gpx') )
            return;
        let gpx = gpxs[row.get('gpx')];
        let pts = [];
        gpx.tracks.forEach(track => pts.push(track.distance.cumul));
        return pts;
    });
    dff = dff.withColumn('inst_speed', function(row) {
        if( !row.get('gpx') )
            return;
        let dist = row.get('cumul_dist');
        let times = row.get('times');
        return movingSpeed(dist, times);
    });
    let map = createMapPlot(dff);
    // console.log(map.data);
    let speed = createSpeedPlot(dff);
    let ele = createElevationPlot(dff);

    $('#activityModal').on('shown.bs.modal', function (e) {
        Plotly.newPlot('mapPlot', map.data, map.layout);
        Plotly.newPlot('speedPlot', speed.data, speed.layout);
        Plotly.newPlot('elevationPlot', ele.data, ele.layout);

        document.getElementById('mapPlot').on('plotly_hover', function(data) {
            let speedData = speed.data.concat([{x: [data.points[0].customdata[0]], y: [data.points[0].customdata[1]], type: 'scatter', mode: 'markers', marker:{size:8}, showlegend: false}]);
            Plotly.Fx.hover('speedPlot',[{curveNumber: data.points[0].curveNumber/3, pointNumber: data.points[0].pointNumber}]);
            Plotly.react('speedPlot', speedData, speed.layout);
            let eleData = ele.data.concat([{x: [data.points[0].customdata[0]], y: [data.points[0].customdata[2]], type: 'scatter', mode: 'markers', marker:{size:8}, showlegend: false}]);
            Plotly.Fx.hover('elevationPlot',[{curveNumber: data.points[0].curveNumber/3, pointNumber: data.points[0].pointNumber}]);
            Plotly.react('elevationPlot', eleData, ele.layout);
        });
        document.getElementById('mapPlot').on('plotly_unhover', function(data) {
            Plotly.Fx.hover('speedPlot', []);
            Plotly.react('speedPlot', speed.data, speed.layout);
            Plotly.Fx.hover('elevationPlot', []);
            Plotly.react('elevationPlot', ele.data, ele.layout);
        });

        document.getElementById('speedPlot').on('plotly_hover', function(data) {
            let mapData = map.data.concat([{lon: [data.points[0].customdata[1]], lat: [data.points[0].customdata[2]], type:'scattermapbox', mode: 'markers', marker:{size:8}, showlegend: false}]);
            // Plotly.Fx.hover('mapPlot', [{curveNumber: data.points[0].curveNumber*3, pointNumber: data.points[0].pointNumber}], 'mapbox');
            // Plotly.Fx.hover('mapPlot', []), 'mapbox');
            Plotly.react('mapPlot', mapData, map.layout);
            let eleData = ele.data.concat([{x: [data.points[0].x], y: [data.points[0].customdata[0]], type: 'scatter', mode: 'markers', marker:{size:8}, showlegend: false}]);
            Plotly.Fx.hover('elevationPlot',[{curveNumber: data.points[0].curveNumber, pointNumber: data.points[0].pointNumber}]);
            Plotly.react('elevationPlot', eleData, ele.layout);
        });
        document.getElementById('speedPlot').on('plotly_unhover', function(data) {
            Plotly.Fx.hover('mapPlot', [], 'mapbox');
            Plotly.react('mapPlot', map.data, map.layout);
            Plotly.Fx.hover('elevationPlot', []);
            Plotly.react('elevationPlot', ele.data, ele.layout);
        });

        document.getElementById('elevationPlot').on('plotly_hover', function(data) {
            let mapData = map.data.concat([{lon: [data.points[0].customdata[1]], lat: [data.points[0].customdata[2]], type:'scattermapbox', mode: 'markers', marker:{size:8}, showlegend: false}]);
            Plotly.react('mapPlot', mapData, map.layout);
            let speedData = speed.data.concat([{x: [data.points[0].x], y: [data.points[0].customdata[0]], type: 'scatter', mode: 'markers', marker:{size:8}, showlegend: false}]);
            Plotly.Fx.hover('speedPlot',[{curveNumber: data.points[0].curveNumber, pointNumber: data.points[0].pointNumber}]);
            Plotly.react('speedPlot', speedData, speed.layout);
        });
        document.getElementById('elevationPlot').on('plotly_unhover', function(data) {
            Plotly.Fx.hover('mapPlot', [], 'mapbox');
            Plotly.react('mapPlot', map.data, map.layout);
            Plotly.Fx.hover('speedPlot', []);
            Plotly.react('speedPlot', speed.data, speed.layout);
        });
    });
}

function createMapPlot(dff) {
    var bounds = {minLat: 90, maxLat: -90, minLon: 180, maxLon: -180};
    var data = dff.reduce(function(data, row) {
        let date = moment(row.get('date')).utc().format('YYYY-MM-DD HH:mm:ss');
        let lons = row.get('lon'), lats = row.get('lat');
        let speeds = row.get('inst_speed'), eles = row.get('ele'), dists = row.get('cumul_dist'), times = row.get('cumul_times');
        lons.forEach(function(lon, i) {
            bounds.minLon = Math.min(bounds.minLon, Math.min(...lon));
            bounds.maxLon = Math.max(bounds.maxLon, Math.max(...lon));
            bounds.minLat = Math.min(bounds.minLat, Math.min(...lats[i]));
            bounds.maxLat = Math.max(bounds.maxLat, Math.max(...lats[i]));
            let customdataT = [dists[i], speeds[i], eles[i], times[i]];
            const customdata = customdataT.reduce(
                ($, row) => row.map((_, i) => [...($[i] || []), row[i]]), 
                []
            )
            dataT = {
                type: 'scattermapbox',
                mode: 'markers+lines',
                name: date,
                lon: lon,
                lat: lats[i],
                customdata: customdata,
                hovertemplate: 'Distance: %{customdata[0]:.2f} m<br>Vitesse: %{customdata[1]:.2f} km/h<br>Elevation: %{customdata[2]} m<br>Temps: %{customdata[3]}',
                // subplot: 'mapbox'
            };
            data.push(dataT);
            data.push({type:'scattermapbox',mode:'markers',lon:[lon[0]],lat:[lats[i][0]],marker:{size:8,color:'green'},name:date,showlegend:false,hovertemplate:'Départ'});
            data.push({type:'scattermapbox',mode:'markers',lon:[lon[lon.length-1]],lat:[lats[i][lats[i].length-1]],marker:{size:8,color:'red'},name:date,showlegend:false,hovertemplate:'Arrivé'});
        });
        return data;
    }, []);

    let zc = zoomCenter(bounds);
    let layoutmap = {
        'mapbox': {
            'style':'basic',
            'accesstoken':mapbox_token,
            'center': {
                'lat':zc.center['lat'],
                'lon':zc.center['lon']
            },
            'zoom':zc.zoom
        },
        'height':350,
        'margin': {
            't':30,
            'b':0
        },
        'showlegend':data.length>3,
        "uirevision":1
    };

    return {data:data, layout:layoutmap};
}

function createSpeedPlot(dff) {
    var data = dff.reduce(function(data, row) {
        let date = moment(row.get('date')).utc().format('YYYY-MM-DD HH:mm:ss');
        let speeds = row.get('inst_speed'), dists = row.get('cumul_dist');
        let lons = row.get('lon'), lats = row.get('lat'), eles = row.get('ele'), times = row.get('cumul_times');
        speeds.forEach(function(speed, i) {
            let customdataT = [eles[i], lons[i], lats[i], times[i]];
            const customdata = customdataT.reduce(
                ($, row) => row.map((_, i) => [...($[i] || []), row[i]]), 
                []
            )
            dataT = {
                type: 'scatter',
                mode: 'markers+lines',
                name: date,
                x: dists[i],
                y: speed,
                line:{shape:'spline',smoothing:1.3},
                marker: {opacity: 0},
                customdata: customdata,
                hovertemplate: 'Distance: %{x:.2f} m<br>Vitesse: %{y:.2f} km/h<br>Elevation: %{customdata[0]} m<br>Temps: %{customdata[3]}',

            };
            data.push(dataT);
        });
        return data;
    }, []);
    let layoutspeed = {
        height:300,
        margin: {
            t:30,
            b:30
        },
        yaxis: {
            title:'vitesse'
        },
        xaxis: {
            title:'distance',
            ticksuffix:'m'
        },
        // hovermode:'closest',
        // hoverdistance:50,
        // dragmode:'select',
        // selectdirection:'h',
        showlegend: data.length>1,
        uirevision: 1
    }

    return {data:data, layout:layoutspeed};
}

function createElevationPlot(dff) {
    var data = dff.reduce(function(data, row) {
        let date = moment(row.get('date')).utc().format('YYYY-MM-DD HH:mm:ss');
        let eles = row.get('ele'), dists = row.get('cumul_dist');
        let lons = row.get('lon'), lats = row.get('lat'), speeds = row.get('inst_speed'), times = row.get('cumul_times');
        eles.forEach(function(ele, i) {
            let customdataT = [speeds[i], lons[i], lats[i], times[i]];
            const customdata = customdataT.reduce(
                ($, row) => row.map((_, i) => [...($[i] || []), row[i]]), 
                []
            )
            dataT = {
                type: 'scatter',
                mode: 'markers+lines',
                name: date,
                x: dists[i],
                y: ele,
                line:{shape:'spline',smoothing:1.3},
                marker: {opacity: 0},
                customdata: customdata,
                hovertemplate: 'Distance: %{x:.2f} m<br>Vitesse: %{customdata[0]:.2f} km/h<br>Elevation: %{y} m<br>Temps: %{customdata[3]}',
            };
            data.push(dataT);
        });
        return data;
    }, []);
    let layoutele = {
        height:300,
        margin: {
            t:30,
            b:30
        },
        yaxis: {
            title:'elevation'
        },
        xaxis: {
            title:'distance',
            ticksuffix:'m'
        },
        // hovermode:'closest',
        // hoverdistance:50,
        // dragmode:'select',
        // selectdirection:'h',
        showlegend: data.length>1,
        uirevision: 1
    }

    return {data:data, layout:layoutele};
}

var DataFrame = dfjs.DataFrame;
var df = new DataFrame(data);
df = df.withColumn('year', row => moment(row.get('date')).startOf('year').format());
df = df.withColumn('month', row => moment(row.get('date')).startOf('month').format());
df = df.withColumn('week', row => moment(row.get('date')).startOf('week').format());
df = df.withColumn('activite', row => 1);
let catSize = 3;
df = df.withColumn('category', row => catSize*Math.floor(row.get('distance')/catSize)+"-"+catSize*(1+Math.floor(row.get('distance')/catSize)));

moment.relativeTimeThreshold('s', 60);
moment.relativeTimeThreshold('ss', 0);
moment.relativeTimeThreshold('m', 60);
moment.relativeTimeThreshold('h', 24);
moment.relativeTimeThreshold('d', 7);
moment.relativeTimeThreshold('w', 4);
moment.relativeTimeThreshold('M', 12);

let stats = {
    'speed': {label:'Vitesse', type:'float', unit:'km/h'},
    'pace': {label:'Rythme', type:'time', unit:'min/km'},
    'duration': {label:'Durée', type:'time', unit:''},
    'distance': {label:'Distance', type:'float', unit:'km'},
    'activite': {label:'Activité', type:'int', unit:''},
};
let periods = {
    'date': {label:'activité', text:'Activité du %d/%m/%Y'},
    'week': {label:'semaine', text:'Semaine du %d/%m/%Y'},
    'month': {label:'mois', text:'Mois de %B %Y'},
    'year': {label:'année', text:'Année %Y'}
};

plotGraph("mean_speed", "date", 1);
updateCards({});

var datatable = df.sortBy("date", true).toCollection();
var $table = $('#table')
$table.bootstrapTable({
    clickToSelect: true,
    search: true,
    buttons: "tableButtons",
    showButtonText: true,
    toolbar: "#toolbar",
    onClickCell: clickCell,
    data: datatable})

let categorySelect = document.getElementById("tableCategory");
let categories = df.unique('category').sortBy('category').toArray('category');
categories.forEach(function(cat) {
    var opt = document.createElement('option');
    opt.value = cat;
    opt.text = cat;
    categorySelect.appendChild(opt);
});
categorySelect.addEventListener('change', (event) => {
    var cat = event.target.value;
    var filter;
    if( cat == "all" )
        filter = {};
    else
        filter = {category: cat};
    $table.bootstrapTable('filterBy', filter)
});

// let datamap = [{lon: [7.7682], lat:[48.56654], type: 'scattermapbox', mode: 'markers+lines'}];
// let layoutmap = {mapbox: {style: 'basic', accesstoken: mapbox_token, center: {lon: 7.7682, lat: 48.56654}, zoom: 18}, height: 350, margin: {t: 30, b: 0}, uirevision: 1};
// let config = {locale: 'fr', responsive: true};
// Plotly.newPlot('testmap', datamap, layoutmap, config);
// Plotly.Fx.hover('testmap', [{curveNumber:0, pointNumber:0}], 'mapbox');
