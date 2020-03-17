<html>
  <head>
    <meta charset="utf-8" />
    <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/4.4.1/css/bootstrap.min.css">
    <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.4.1/jquery.min.js"></script>
    <script type="text/javascript" charset="utf8" src="https://cdnjs.cloudflare.com/ajax/libs/PapaParse/5.1.0/papaparse.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.16.0/umd/popper.min.js"></script>
    <script src="https://maxcdn.bootstrapcdn.com/bootstrap/4.4.1/js/bootstrap.min.js"></script>
    <link rel="stylesheet" type="text/css" href="https://cdn.datatables.net/1.10.20/css/jquery.dataTables.css">
    <script type="text/javascript" charset="utf8" src="https://cdn.datatables.net/1.10.20/js/jquery.dataTables.js"></script>
    <script src="http://d3js.org/d3.v3.min.js" charset="utf-8"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.8.4/moment.min.js"></script>
    <script src="https://cdn.datatables.net/plug-ins/1.10.20/sorting/datetime-moment.js"></script>
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.6.0/dist/leaflet.css"
    	  integrity="sha512-xwE/Az9zrjBIphAcBb3F6JVqxf46+CDLwfLMHloNu6KEQCAWi6HcDUbeOfBIptF7tcCzusKFjFw2yuvEpDL9wQ=="
    	  crossorigin=""/>
    <script src="https://unpkg.com/leaflet@1.6.0/dist/leaflet.js"
    	    integrity="sha512-gZwIG9x3wUXg2hdXF6+rVkLF/0Vi9U8D2Ntg4Ga5I5BZpVkVxlJWbSQtXPSiUTtC0TjtGOmxa1AJPuV0CPthew=="
    	    crossorigin=""></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet-gpx/1.4.0/gpx.min.js"></script>
  </head>
  <body>
    <object data="rythme.html" width="100%" height="100%"></object>
    <object data="distance_tot.html" width="100%" height="100%"></object>
    <object data="distance_moyenne.html" width="100%" height="100%"></object>
    <object data="duree_tot.html" width="100%" height="100%"></object>
    <object data="duree_moyenne.html" width="100%" height="100%"></object>
    <object data="activite.html" width="100%" height="100%"></object>
    <object data="categories.html" width="100%" height="100%"></object>
    <object data="bycategorie.html" width="100%" height="100%"></object>

    <div class="container-fluid">
      <div class="dropdown">
    	<button type="button" class="btn btn-primary dropdown-toggle" data-toggle="dropdown">
    	  Catégories
    	</button>
    	<div class="dropdown-menu">
    	  <a class="dropdown-item" id="filter-all">Toutes</a>
    	  <a class="dropdown-item" id="filter-0">0-4</a>
    	  <a class="dropdown-item" id="filter-1">4-8</a>
    	  <a class="dropdown-item" id="filter-2">8-12</a>
    	  <a class="dropdown-item" id="filter-3">12-16</a>
    	  <a class="dropdown-item" id="filter-4">16-20</a>
    	</div>
      </div>
      <div class="table-responsive">
    	<table id="example" class="table table-hover"></table>
      </div>
    </div>

    <div class="modal fade" id="exampleModal" tabindex="-1" role="dialog" aria-labelledby="exampleModalLabel" aria-hidden="true">
      <div class="modal-dialog modal-xl" role="document">
    	<div class="modal-content">
    	  <div class="modal-header">
    	    <h5 class="modal-title" id="exampleModalLabel">Activité</h5>
    	    <button type="button" class="close" data-dismiss="modal" aria-label="Close">
    	      <span aria-hidden="true">&times;</span>
    	    </button>
    	  </div>
    	  <div class="modal-body">
    	    <div id="mapid" style="padding-top:50%">
    	    </div>
    	  </div>
    	  <div class="modal-footer">
    	    <button type="button" class="btn btn-primary" data-dismiss="modal">Close</button>
    	  </div>
    	</div>
      </div>
    </div>

    <script type='text/javascript' src='script.js'></script>

  </body>
</html>
