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

function updateCards() {
    let distance = df.reduce((p,n) => p+n.get('distance'), 0);
    document.getElementById("cardDistance").innerHTML = distance.toFixed(2)+" km";
    let cal = df.reduce((p,n) => p+n.get('calories'), 0);
    document.getElementById("cardCalories").innerHTML = cal+" kcal";
    let duration = df.reduce((p,n) => p.add(moment.duration({minutes:n.get('duration').split(':')[0],
                                                             seconds:n.get('duration').split(':')[1]}
                                                           )), moment.duration(0));
    document.getElementById("cardDuration").innerHTML = formatDuration(duration, 2);
    let speed = df.reduce((p,n) => p + n.get('speed'), 0)/df.count();
    document.getElementById("cardSpeed").innerHTML = speed.toFixed(2)+ "km/h";
}

function movingAvg(array, count) {
    var r = [], i;
    for(i = 0; i < array.length - count+1; i++) {
        var a = 0, j;
        for(j = 0; j < count; j++) {
            a = a + array[i+j];
        }
        r.push(a/count);
    }
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
            // let avg = sum.asSeconds()/group.count();
            // let avgM = moment.duration({seconds: avg});
            // return avgM.hours()+":"+avgM.minutes()+":"+avgM.seconds();
            // return avg; //moment.duration({seconds: avg}).asSeconds();
        } else {
            return sum;
            // if( sum.asDays() > 1 )
            //     return sum.asHours();
            // else
            //     return sum.hours()+":"+sum.minutes()+":"+sum.seconds();
            // return sum.asSeconds();
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
    var hoverformat = '%{y}';
    var customdata = []
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
            customdataDf = customdataDf.drop('aggregation');
            customdataDf = customdataDf.drop(by);
            customdataDf = customdataDf.drop('duration');
            customdata = customdataDf.toArray()
            dff = dff.map(row => row.set('aggregation', moment.duration({seconds:row.get('aggregation')}).asHours()));
            layout['yaxis']['title'] = "h";
            hoverformat = '%{customdata[0]}j %{customdata[1]}h %{customdata[2]}m %{customdata[3]}s';
        }
        else if( max > 3600 ) {
            dff = dff.map(row => row.set('aggregation', moment(row.get('aggregation')*1000).utc().format()));
            layout['yaxis']['tickformat'] = '%H:%M:%S';
        }
        else {
            dff = dff.map(row => row.set('aggregation', moment(row.get('aggregation')*1000).utc().format()));
            layout['yaxis']['tickformat'] = '%M:%S';
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
        plot.push({
            x:dff.slice(avg-1).toArray(by),
            y:movingAvg(dff.sortBy(by).toArray("aggregation"), avg),
            type: 'lines',
            hovertemplate: 'Moyenne sur '+avg+' '+byL,
            hoverlabel: {namelength:0}
        });
    }
    let config = {locale: 'fr', responsive: true};
    Plotly.newPlot("test", plot, layout, config );
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
updateCards();

