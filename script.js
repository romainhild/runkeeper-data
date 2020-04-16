var cat = ["0-4","4-8","8-12","12-16","16-20"];
var mymap = L.map('mapid');

Papa.parse('runkeeper-data/cardioActivities.csv', {
    header: true,
    download: true,
    dynamicTyping: true,
    skipEmptyLines: true,
    complete: function(results) {
	data = results.data;
	data.forEach(function(value) {
	    value.category = cat[Math.floor(value["Distance (km)"]/4)];
	});
	var dataTables = $('#example').DataTable( {
	    data:data,
	    paging: false,
	    fixedHeader: true,
	    columns: [
		{ data: null },
		{ data: "Date",
		  title: "Date" },
		{ data: "Distance (km)",
		  title: "Distance" },
		{ data: "Average Pace",
		  title: "Rythme" },
	    	{ data: "Average Speed (km/h)",
		  title: "Vitesse" },
	    	{ data: "Duration",
		  title: "Durée" },
		{ data: "category" },
		{ data: "GPX File" }
	    ],
	    "columnDefs": [
		{
		    "targets": 0,
		    "searchable": false,
		    "orderable": false,
		    "width": "5%"
		},
		{
		    "targets": 1,
		    "render": function(data, type, full, meta) {
			if( type == 'display' && data ) {
			    var mDate = moment(data, "YYYY-MM-DD HH:mm:ss");
			    if( mDate && mDate.isValid() ) {
				data = mDate.date()+'/'+(mDate.month()+1)+'/'+mDate.year()+' '+mDate.hour()+'h '+mDate.minute()+'m';
			    }
			    return data;
			}
			else {
			    return data;
			}
		    }
		},
		{
		    "targets": 2,
		    "render": function(data, type, full, meta) {
			if( type == 'display' && data ) {
			    return data + ' km';
			}
			else {
			    return data;
			}
		    }
		},
		{
		    "targets": 3,
		    "render": function(data, type, full, meta) {
			if( type == 'display' && data ) {
			    return data + ' min/km';
			}
			else {
			    return data;
			}
		    }
		},
		{
		    "targets": 4,
		    "render": function(data, type, full, meta) {
			if( type == 'display' && data ) {
			    return data + ' km/h';
			}
			else {
			    return data;
			}
		    }
		},
		{
		    "targets": 5,
		    "render": function(data, type, full, meta) {
			if (type == 'sort') {
			    if (data) {
			    	var mDate = moment(data, ["H:mm:ss","mm:ss","m:ss"]);
			    	data = (mDate && mDate.isValid()) ? mDate.format('HH:mm:ss') : '';
			    }
			    return data;
			}
			else if( type == 'display' ) {
			    if (data) {
			    	var mDate = moment(data, ["H:mm:ss","mm:ss","m:ss"]);
				if( mDate && mDate.isValid() ) {
				    if( mDate.hour() > 0 ) {
					data = mDate.hour()+'h '+mDate.minute()+'m '+mDate.second()+'s';
				    } else {
					data = mDate.minute()+'m '+mDate.second()+'s';
				    }
				}
			    }
			    return data;
			}
			else {
			    return data;
			}
		    }
		},
		{
		    "targets":[6,7],
		    "visible": false
		}
	    ]   
	} );
	$('#filter-all').on('click', function () {
	    dataTables.columns(6).search("").draw();
	});
	$('#filter-0').on('click', function () {
	    dataTables.columns(6).search("0-4" ).draw();
	});
	$('#filter-1').on('click', function () {
	    dataTables.columns(6).search("4-8" ).draw();
	});
	$('#filter-2').on('click', function () {
	    dataTables.columns(6).search("8-12" ).draw();
	});
	$('#filter-3').on('click', function () {
	    dataTables.columns(6).search("12-16" ).draw();
	});
	$('#filter-4').on('click', function () {
	    dataTables.columns(6).search("16-20" ).draw();
	});

	dataTables.on( 'order.dt search.dt', function () {
	    dataTables.column(0, {search:'applied', order:'applied'}).nodes().each( function (cell, i) {
		cell.innerHTML = i+1;
	    } );
	} ).draw();

	$('#example tbody').on( 'click', 'tr', function () {
	    var gpx = 'runkeeper-data/'+dataTables.row($(this)).data()["GPX File"]; // URL to your GPX file or the GPX itself

	    mymap.eachLayer(function(layer){
		mymap.removeLayer(layer);
	    });
	    L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
	    	attribution: 'Map data &copy; <a href="http://www.osm.org">OpenStreetMap</a>'
	    }).addTo(mymap);
	    new L.GPX(gpx, {
	    	async: true,
	    	marker_options: {
	            startIconUrl: 'pin-images/pin-icon-start.png',
	            endIconUrl: 'pin-images/pin-icon-end.png',
	            shadowUrl: 'pin-images/pin-shadow.png'
	    	}
	    }).on('loaded', function(e) {
	    	mymap.fitBounds(e.target.getBounds());
	    }).addTo(mymap);

	    $('#exampleModal').modal()
	} );
    }
});

$('#exampleModal').on('shown.bs.modal', function(){
    setTimeout(function() {
	mymap.invalidateSize();
    }, 10);
});


