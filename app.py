# -*- coding: utf-8 -*-
import os.path
import math

import dash
import dash_table
import dash_core_components as dcc
import dash_html_components as html
import dash_bootstrap_components as dbc

import pandas as pd
pd.options.mode.chained_assignment = None  # default='warn'
import numpy as np
import scipy as sp
import plotly.graph_objects as go
from plotly.subplots import make_subplots

token = open(".mapbox_token").read()

import gpxpy

import locale
locale.setlocale(locale.LC_ALL, 'fr_FR')
config_plot={'locale':'fr'}


#### start of the Dash app
external_scripts = ['https://cdn.plot.ly/plotly-locale-fr-latest.js']
app = dash.Dash(__name__, external_stylesheets=[dbc.themes.BOOTSTRAP],external_scripts=external_scripts)


#### prepare database
df = pd.read_csv("runkeeper-data/cardioActivities.csv")
df["Rank"] = range(1, len(df)+1)
df["Date"] = pd.to_datetime(df["Date"])
df["Date_str"] = df["Date"].dt.strftime('%A %d %B %Y à %H:%M')
df["Duration_str"] = df["Duration"]
df["Duration"] = df["Duration"].apply(lambda x: "00:"+x if x.count(':') < 2 else x)
df["Duration"] = pd.to_timedelta(df["Duration"])
df["Average Pace_str"] = df["Average Pace"]
df["Average Pace"] = df["Average Pace"].apply(lambda x: "00:"+x if x.count(':') < 2 else x)
df["Average Pace"] = pd.to_timedelta(df["Average Pace"])

catSize = 3
df["Categorie"] = (catSize*(df["Distance (km)"]//catSize)).astype(int).astype(str)+"-"+(catSize*(1+df["Distance (km)"]//catSize)).astype(int).astype(str)
df["Categorie_sort"] = (df["Distance (km)"]//catSize).astype(int)

dfw = df.groupby(df.Date.dt.to_period("W")).agg([('mean',lambda x: x.mean(numeric_only=False)), 
                                                 ('sum', lambda x: x.sum(numeric_only=False)),
                                                 ('count', 'count')])
dfm = df.groupby(df.Date.dt.to_period("M")).agg([('mean',lambda x: x.mean(numeric_only=False)), 
                                                 ('sum', lambda x: x.sum(numeric_only=False)),
                                                 ('count', 'count')])
dfy = df.groupby(df.Date.dt.to_period("Y")).agg([('mean',lambda x: x.mean(numeric_only=False)), 
                                                 ('sum', lambda x: x.sum(numeric_only=False)),
                                                 ('count', 'count')])
dfc = df.groupby(df.Categorie).agg([('mean',lambda x: x.mean(numeric_only=False)), 
                                    ('sum', lambda x: x.sum(numeric_only=False)),
                                    ('count', 'count')])

#### create some dictionaries
period = {
    'A': { 'data':df, 'label':'Activité', 'text':'Activité du %d/%m/%Y'},
    'S': { 'data':dfw, 'label':'Semaine', 'text':'Semaine du %d/%m/%Y'},
    'M': { 'data':dfm, 'label':'Mois', 'text':'Mois de %B %Y'},
    'Y': { 'data':dfy, 'label':'Année', 'text':'Année %Y'}
}
statistiques = {
    'S': {'label':'Vitesse','key':'Average Speed (km/h)','unit':'km/h','agg':'mean','type':'float'},
    'R': {'label':'Rythme','key':'Average Pace','unit':'min/km','agg':'mean','type':'time'},
    'Dut': {'label':'Durée totale','key':'Duration','unit':'','agg':'sum','type':'time'},
    'Dum': {'label':'Durée moyenne','key':'Duration','unit':'','agg':'mean','type':'time'},
    'Dit': {'label':'Distance totale','key':'Distance (km)','unit':'km','agg':'sum','type':'float'},
    'Dim': {'label':'Distance moyenne','key':'Distance (km)','unit':'km','agg':'mean','type':'float'},
    'A': {'label':'Activités','key':'Duration','unit':'','agg':'count','type':'int'}
}
tables = {
    'Rank': {'sort':'Rank','name':'Rang','suffix':''},
    'Date_str': {'sort':'Date','name':'Date','suffix':''},
    'Average Speed (km/h)': {'sort':'Average Speed (km/h)','name':'Vitesse','suffix':' km/h'},
    'Average Pace_str': {'sort':'Average Pace','name':'Rythme','suffix':' min/km'},
    'Distance (km)': {'sort':'Distance (km)','name':'Distance','suffix':' km'},
    'Duration_str': {'sort':'Duration','name':'Durée','suffix':''}
}


#### title
title = dbc.Container([
    html.H1(children='Runkeeper Data'),
    html.H2(children='Statistiques provenant de Runkeeper')
])

#### activities controls and graph
activityCol = dbc.Col(
    dbc.Form([
        dbc.FormGroup([
            dbc.Label("Statistiques", html_for="stat-rd"),
            dbc.RadioItems(
                id='stat-rd',
                options=[ { 'label':v['label'], 'value':k } for k,v in statistiques.items() ],
                value='S',
                labelStyle={'display': 'block'}
            )
        ])
    ]),
    width=6
)
periodCol = dbc.Col(
    dbc.Form([
        dbc.FormGroup([
            dbc.Label("Par", html_for="time-rd"),
            dbc.RadioItems(
            id='time-rd',
                options=[{'label':period[p]['label'], 'value':p} for p in period],
                value='A'
            )
        ])       
    ]),
    width=6
)
statRow = dbc.Row([activityCol, periodCol], form=True )
meanRow = dbc.Row([
    dbc.Col(
        dbc.Form([
            dbc.FormGroup([
                dbc.Label("Moyenne:", html_for="mean-ck"),
                dbc.Checklist(
                id='mean-ck',
                    options=[{'label':'Moyenne sur:','value':'mean'}],
                    value=[]
                )]
            ),
            dbc.FormGroup([
                dbc.Label("Fenêtre:", html_for="mean-sl"),
                dcc.Slider(
                    id='mean-sl',
                    min=1,
                    max=15,
                    marks={i:str(i) for i in range(1,16)},
                    value=3,
                    disabled=True
                )
            ])
        ]),
        width=12
    )
])
statRow = dbc.Row(
    [
        dbc.Col([statRow, meanRow], width=4 ),
        dbc.Col(dcc.Graph(id='example-graph',config=config_plot),width=8)
    ],
    align='center'
)

#### disable activity radio button when mean or activity stat
@app.callback(
    dash.dependencies.Output('time-rd','options'),
    [dash.dependencies.Input('stat-rd','value')]
)
def setTimeOptions(stat):
    options=[
        {'label':'Activité', 'value':'A','disabled':True},
        {'label':'Semaine', 'value':'S'},
        {'label':'Mois', 'value':'M'},
        {'label':'Année', 'value':'Y'}
    ]
    if stat not in ['A','Dim','Dum']:
        options[0]['disabled']=False
    return options

#### set the value accordingly
@app.callback(
    dash.dependencies.Output('time-rd','value'),
    [dash.dependencies.Input('time-rd','options')],
    [dash.dependencies.State('time-rd','value')]
)
def setTimeValue(options,value):
    if options[0]['disabled'] and value == 'A':
        return 'S'
    else:
        return value

#### disable mean slider with the checkbox
@app.callback(
    dash.dependencies.Output('mean-sl','disabled'),
    [dash.dependencies.Input('mean-ck','value')]
)
def setMeanValue(mean):
    return not 'mean' in mean

#### update graph with activity, period and mean
@app.callback(
    dash.dependencies.Output('example-graph','figure'),
    [dash.dependencies.Input('time-rd','value'),
     dash.dependencies.Input('mean-sl','value'),
     dash.dependencies.Input('mean-sl','disabled')
    ],
    [dash.dependencies.State('stat-rd','value')]
)
def update_graph(time,window,nomean,stat):
    dft = period[time]['data']
    x = dft["Date"] if time == 'A' else dft.index.to_timestamp()
    data = [{'x':x, 'type':'bar','name':''}]
    y = dft[statistiques[stat]['key']]
    if time != 'A':
        y = y[statistiques[stat]['agg']]
    layout = {
        'showlegend':False,
        'xaxis': {
            'type':'date',
            'rangeslider': {'visible':True},
            'hoverformat': period[time]['text'],
            "uirevision":time
        },
        "yaxis": { "title":statistiques[stat]['unit'] },
        'margin':{'r':0,'t':100,'b':50},
        'title':statistiques[stat]['label'],
        'hovermode':'x unified'
    }
    if statistiques[stat]['type'] == 'int':
        hoverformat = "%{y:d}"
    else:
        hoverformat = '%{y}'
    if statistiques[stat]['type'] == 'time':
        maxtime = y.max(numeric_only=False)
        if maxtime.total_seconds() < 3600:
            y1 = y+pd.to_datetime('1970/01/01')
            layout['yaxis']['tickformat'] = "%M:%S"
        elif maxtime.total_seconds() < 86400:
            y1 = y+pd.to_datetime('1970/01/01')
            layout['yaxis']['tickformat'] = "%H:%M:%S"
        else:
            y1 = y.dt.total_seconds()/3600
            layout['yaxis']['ticksuffix'] = 'h'
            data[0]['customdata'] = y.dt.components[:][:5].to_numpy()
            hoverformat = '%{customdata[0]}j %{customdata[1]}h %{customdata[2]}m %{customdata[3]}s'
    else:
        y1 = y
        layout['yaxis']['tickformat'] = ".2f"
    data[0]['y'] = y1
    data[0]['hovertemplate'] = statistiques[stat]['label'] + ': ' + hoverformat + ' ' + statistiques[stat]['unit']

    if not nomean:
        d = {'x':x,'name':''}
        if statistiques[stat]['type'] == 'time':
            yy = pd.to_timedelta(y.dt.total_seconds().rolling(window=window,center=True).mean(),unit='s')
            maxtime = y.max(numeric_only=False)
            if maxtime.total_seconds() >= 86400:
                d['customdata'] = yy.dt.components[:][:5].to_numpy()
                yy = yy.dt.total_seconds()/3600
                hoverformat = '%{customdata[0]}j %{customdata[1]}h %{customdata[2]}m %{customdata[3]}s'
            else:
                yy = yy+pd.to_datetime('1970/01/01')
                hoverformat = '%{y}'
        else:
            yy = y.rolling(window=window,center=True).mean()
            hoverformat = '%{y}'

        d['y'] = yy
        d['hovertemplate'] = 'Moyenne sur '+str(window)+' '+period[time]['label'].lower()+('' if window==1 or time == 'M' else 's') + ': '+hoverformat+ ' ' +statistiques[stat]['unit']
        data.append(d)
    return {
        'data': data,
        'layout': layout
    }


#### categories graph
fig = make_subplots(rows=2, cols=2, subplot_titles=("Distance", "Rythme", "Durée", "Activités"))
fig.add_bar(x=dfc.index,y=dfc["Distance (km)"]["sum"],row=1,col=1,name="",hovertemplate='Categorie: %{x} km<br>Distance totale: %{y} km')
fig.add_bar(x=dfc.index,y=dfc["Average Pace"]["mean"]+ pd.to_datetime('1970/01/01'),row=1,col=2,name='',hovertemplate='Categorie: %{x} km<br>Rythme: %{y} min/km')
fig.add_bar(x=dfc.index,y=dfc["Duration"]["sum"].dt.total_seconds()/3600,row=2,col=1,name="",hovertemplate='Categorie: %{x} km<br>Durée totale: %{customdata[0]}j %{customdata[1]}h %{customdata[2]}m %{customdata[3]}s',customdata=dfc["Duration"]["sum"].dt.components)
fig.add_bar(x=dfc.index,y=dfc["Duration"]['count'],row=2,col=2,name="",hovertemplate='Categorie: %{x} km<br>Activités: %{y}')
fig.update_yaxes(title="km",row=1,col=1)
fig.update_yaxes(title="min/km", tickformat="%M:%S",row=1,col=2)
fig.update_yaxes(title="heure",ticksuffix="h",row=2,col=1)
fig.update_layout(showlegend=False,margin={'t':50,'r':0,'l':0,'b':50})

catRow = dbc.Row([
    dbc.Col(
        dcc.Graph(
            id='categories-graph',
            figure={
                'data':[{
                    'type':'pie',
                    'labels':dfc.index,
                    'values':dfc["Duration"]['count'],
                    'hovertemplate':'Categorie: %{label} km<br>Activités: %{value}<br>%{percent}',
                    'name':""
                }],
                'layout': {
                    'title':'Categories',
                    'margin':{'r':0,'t':50,'b':50}
                }
            }
        ),
        width=6
    ),
    dbc.Col(
        dcc.Graph(
            id='bycategories-graph',
            figure=fig
        ),
        width=6
    )
])

#### filter and info for table
columnsTable = set()
for k,v in tables.items():
    columnsTable.add(k)
    columnsTable.add(v['sort'])
pageSize = 100

filterRow = dbc.Row(
    [
        dbc.Col(
            dbc.FormGroup([
                dbc.Label("Catégorie:", html_for="cat-dd"),
                dcc.Dropdown(
                    id='cat-dd',
                    options=[{'label':'Toutes','value':-1}]+[
                        {'label':str(c*catSize)+'-'+str((c+1)*catSize)+' km','value':c}
                        for c in np.sort(df['Categorie_sort'].unique())
                    ],
                    value=-1,
                    searchable=False,
                    clearable=False
                )
            ]),
            width=3
        ),
        dbc.Col(
            dbc.FormGroup([
                dbc.Label("Filtre:", html_for="filter-in"),
                dbc.Input(id='filter-in')
            ]),
            width=6
        ),
        dbc.Col(
            html.Div(
                dbc.FormGroup([
                    dbc.Button("Plus d'infos", id='info-bt'),
                ]),
                className='text-center'
            ),
            width=2
        ),
        dbc.Col(
            html.Div(
                dbc.FormGroup([
                    dbc.Button("Reset", id='clear-bt')
                ]),
                className='text-center'
            ),
            width=1
        )
    ],
    form=True,
    align="end"
)

#### datatable
dataTable = dash_table.DataTable(
    id='table',
    columns=[{ 'name':v['name'], 'id':k} for k,v in tables.items()],
    data=df.to_dict('records'),
    row_selectable='multi',
    page_current=0,
    page_size=pageSize,
    page_action='custom',
    sort_action='custom',
    sort_mode='single',
    sort_by=[]
)

#### clear selection in the table
@app.callback(
    dash.dependencies.Output('table','selected_rows'),
    [dash.dependencies.Input('clear-bt','n_clicks')]
)
def clearSelection(n):
    return []

#### update table when filtered, sorted or paginized
@app.callback(
    [dash.dependencies.Output('table', 'data'),
     dash.dependencies.Output('clear-bt','n_clicks')],
    [dash.dependencies.Input('table', "page_current"),
     dash.dependencies.Input('table', "page_size"),
     dash.dependencies.Input('table', 'sort_by'),
     dash.dependencies.Input('filter-in','value'),
     dash.dependencies.Input('cat-dd','value')]
)
def update_table(page_current, page_size, sort_by, filter_by, by_cat):
    # we don't want to filter on all columns so we keep only what we need to filter
    dff = df[list(columnsTable)]
    if filter_by:
        dff = df[list(columnsTable)+['GPX File','Categorie_sort']][dff.apply(lambda row: row.astype(str).str.contains(filter_by).any(), axis=1)]
    else:
        dff = df[list(columnsTable)+['GPX File','Categorie_sort']]

    if by_cat>= 0:
        dff = dff[dff['Categorie_sort']==by_cat][list(columnsTable)+['GPX File']]
    else:
        dff = dff[list(columnsTable)+['GPX File']]
    
    if len(sort_by):
        dff.sort_values(
            tables[sort_by[0]['column_id']]['sort'], # we use the data colomn to sort
            ascending=sort_by[0]['direction'] == 'asc',
            inplace=True
        )

    dff["Rank"] = range(1, len(dff)+1)

    return [dff.iloc[
        page_current*page_size:(page_current+ 1)*page_size
    ].to_dict('records'),1]


#### modal for gpx info
# meter per pixel at zoom level 0 by latitude
x = np.array([0,20,40,60,80])
y = np.array([78271,73551,59959,39135,13591])
z = np.polyfit(x, y, 3)
mp0 = np.poly1d(z)
def zoomCenter(bounds):
    minLat = min(list(map(lambda b: b.min_latitude, bounds)))
    maxLat = max(list(map(lambda b: b.max_latitude, bounds)))
    minLon = min(list(map(lambda b: b.min_longitude, bounds)))
    maxLon = max(list(map(lambda b: b.max_longitude, bounds)))
            
    dx = gpxpy.gpx.GPXTrackPoint(maxLat,maxLon).distance_2d(gpxpy.gpx.GPXTrackPoint(maxLat,minLon))
    dy = gpxpy.gpx.GPXTrackPoint(maxLat,maxLon).distance_2d(gpxpy.gpx.GPXTrackPoint(minLat,maxLon))
    # number of pixel on the graph on MY screen !!
    npx = 800
    npy = 300
    # we fit mp0(lat)/(2**z) meter/pixel at zoom level z and latitude lat
    zoomx = math.log2(mp0(minLat+(maxLat-minLat)/2)*npx/dx)
    zoomy = math.log2(mp0(minLat+(maxLat-minLat)/2)*npy/dy)
    return (min(zoomx,zoomy),{'lat':minLat+(maxLat-minLat)/2,'lon':minLon+(maxLon-minLon)/2})

modal = dbc.Modal(
    [
        dbc.ModalHeader("Header",id="modal-header"),
        dbc.ModalBody("Body",id="modal-body"),
        dbc.ModalFooter(
            dbc.Button("Close", id="close", className="ml-auto")
        ),
    ],
    id="modal",
    # scrollable=True,
    backdrop='static',
    size="xl"
)

#### display the modal
@app.callback(
    [dash.dependencies.Output('modal','is_open'),
     dash.dependencies.Output('modal-header','children'),
     dash.dependencies.Output('modal-body','children')],
    [dash.dependencies.Input('info-bt','n_clicks'),
     dash.dependencies.Input('close','n_clicks')],
    [dash.dependencies.State('modal','is_open'),
     dash.dependencies.State('table','data'),
     dash.dependencies.State('table','selected_rows')]
)
def displayModal(n_open,n_close,is_open,dff,rows):
    if is_open or not n_open:
        return [False,"",""]
    if n_open and not rows:
        return [True,"Attention","Veuillez selectionner au moins une course pour afficher plus d'informations."]

    children = []
    dates = []
    gpxfiles = []
    datamap = []
    dataspeed = []
    dataele = []

    # filter rows without gpx file
    for i in rows:
        if not dff[i]['GPX File']:
            children.append(html.Div("Pas de données pour la course du "+dff[i]['Date_str']))
        else:
            gpxfiles.append(dff[i]['GPX File'])
        dates.append(dff[i]['Date_str'])
    if not gpxfiles:
        return [True,"Attention", children]

    if len(dates) == 1:
        title = "Course du " + dates[0]
    else:
        title = "Courses du " + dates[0]
        for i in range(1,len(dates)-1):
            title =  title + ', ' + dates[i]
        title = title + ' et du ' + dates[-1]

    bounds = []
    for f in gpxfiles:
        date = os.path.splitext(os.path.basename(f))[0]
        gpx_file = open('runkeeper-data/'+f,'r')
        gpx = gpxpy.parse(gpx_file)
        track = gpx.tracks[0]
        bounds.append(track.get_bounds())

        dist = 0
        for seg in track.segments:
            d = {}
            d['lon'] = pd.Series(list(map(lambda trkpt: trkpt.longitude, seg.points)))
            d['lat'] = pd.Series(list(map(lambda trkpt: trkpt.latitude, seg.points)))
            d['ele'] = pd.Series(list(map(lambda trkpt: trkpt.elevation, seg.points)))
            d['time'] = pd.to_datetime(pd.Series(list(map(lambda trkpt: trkpt.time, seg.points))))
            d['speed'] = pd.Series([0]+list(map(lambda p: (p[0].speed_between(p[1]) or 0)*3.6, list(zip(seg.points,seg.points[1:])))))
            dpt = np.cumsum([dist]+list(map(lambda p: p[0].distance_3d(p[1]), list(zip(seg.points,seg.points[1:])))))
            dist = dpt[-1]
            d['distance'] = pd.Series(dpt)/1000.
            dff = pd.DataFrame(d)

            dmap = {'type':'scattermapbox','mode':'markers+lines','name':date,
                       'marker':{'opacity':0},'selected':{'marker':{'opacity':1}}}
            dmap['lat'] = dff['lat']
            dmap['lon'] = dff['lon']
            datamap.append(dmap)
            datamap.append({'type':'scattermapbox','mode':'markers','lon':[seg.points[0].longitude],'lat':[seg.points[0].latitude],'marker':{'size':8,'color':'green'},'name':'start','showlegend':False})
            datamap.append({'type':'scattermapbox','mode':'markers','lon':[seg.points[-1].longitude],'lat':[seg.points[-1].latitude],'marker':{'size':8,'color':'red'},'name':'finish','showlegend':False})

            dspeed = { 'type':'scatter','name':date,'mode':'markers+lines',
                       'marker':{'opacity':0},'selected':{'marker':{'opacity':1}},
                       'hovertemplate':'Distance: %{x:.2f} km<br>Vitesse: %{y:.2f} km/h'}
            dspeed['x'] = dff['distance']
            dspeed['y'] = dff['speed'].rolling(window=3,center=True).mean()
            dataspeed.append(dspeed)

            dele = { 'type':'scatter','name':date,'mode':'markers+lines',
                     'marker':{'opacity':0},'selected':{'marker':{'opacity':1}},
                     'hovertemplate':'Distance: %{x:.2f} km<br>Elevation: %{y:.2f} m'}
            dele['x'] = dff['distance']
            dele['y'] = dff['ele']
            dataele.append(dele)

    zoom,center = zoomCenter(bounds)
    
    graphMap = dcc.Graph(
        id='map',
        figure={
            'data': datamap,
            'layout': {
                'mapbox': {
                    'style':'basic',
                    'accesstoken':token,
                    'center': {
                        'lat':center['lat'],
                        'lon':center['lon']
                    },
                    'zoom':zoom
                },
                'height':350,
                'margin': {
                    't':30,
                    'b':0
                },
                'showlegend':len(dataspeed)>1
            }
        }
    )
    children.append(graphMap)

    graphSpeed = dcc.Graph(
        id='speed-graph',
        figure={
            'data': dataspeed,
            'layout': {
                'height':350,
                'margin': {
                    't':30,
                    'b':30
                },
                'yaxis': {
                    'title':'vitesse'
                },
                'xaxis': {
                    'title':'distance'
                },
                'hovermode':'closest',
                'dragmode':'select'
            }
        }
    )
    children.append(graphSpeed)
    
    graphEle = dcc.Graph(
        id='ele-graph',
        figure={
            'data': dataele,
            'layout': {
                'height':350,
                'margin': {
                    't':30,
                    'b':30
                },
                'yaxis': {
                    'title':'elevation'
                },
                'xaxis': {
                    'title':'distance'
                },
                'hovermode':'closest',
                'dragmode':'select'
            }
        }
    )
    children.append(graphEle)
    
    return [True, title, children]


### app layout and title
app.layout = dbc.Container([
    title,
    statRow,
    catRow,
    filterRow,
    dataTable,
    modal
])
app.title = 'Runkeeper-data'


if __name__ == '__main__':
    app.run_server(debug=True)
    
