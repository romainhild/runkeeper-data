# -*- coding: utf-8 -*-
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

df = pd.read_csv("runkeeper-data/cardioActivities.csv")
df["Rank"] = range(1, len(df)+1)
# df["Date_str"] = df["Date"]
df["Date"] = pd.to_datetime(df["Date"])
df["Date_str"] = df["Date"].dt.strftime('%A %d %B %Y %H:%M')
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
dff = { 'A':df, 'S':dfw, 'M':dfm, 'Y':dfy }

statistiques = {
    'S': {'label':'Vitesse','key':'Average Speed (km/h)','unit':'km/h','agg':'mean'},
    'R': {'label':'Rythme','key':'Average Pace','unit':'min/km','agg':'mean'},
    'Dut': {'label':'Durée totale','key':'Duration','unit':'temps','agg':'sum'},
    'Dum': {'label':'Durée moyenne','key':'Duration','unit':'temps','agg':'mean'},
    'Dit': {'label':'Distance totale','key':'Distance (km)','unit':'km','agg':'sum'},
    'Dim': {'label':'Distance moyenne','key':'Distance (km)','unit':'km','agg':'mean'},
    'A': {'label':'Activités','key':'Duration','unit':'','agg':'count'}
    }
tables = {
    'Rank': {'sort':'Rank','name':'Rang','suffix':''},
    'Date_str': {'sort':'Date','name':'Date','suffix':''},
    'Average Speed (km/h)': {'sort':'Average Speed (km/h)','name':'Vitesse','suffix':' km/h'},
    'Average Pace_str': {'sort':'Average Pace','name':'Rythme','suffix':' min/km'},
    'Distance (km)': {'sort':'Distance (km)','name':'Distance','suffix':' km'},
    'Duration_str': {'sort':'Duration','name':'Durée','suffix':''}
}
columnsTable = set()
for k,v in tables.items():
    columnsTable.add(k)
    columnsTable.add(v['sort'])
pageSize = 100

fig = make_subplots(rows=2, cols=2, subplot_titles=("Distance", "Rythme", "Durée", "Activités"))
fig.add_bar(x=dfc.index,y=dfc["Distance (km)"]["sum"],row=1,col=1,name="Distance")
fig.add_bar(x=dfc.index,y=dfc["Average Pace"]["mean"]+ pd.to_datetime('1970/01/01'),row=1,col=2,name='Rythme')
fig.add_bar(x=dfc.index,y=dfc["Duration"]["sum"]+pd.to_datetime('1970/01/01'),row=2,col=1,name="Durée")
fig.add_bar(x=dfc.index,y=dfc["Duration"]['count'],row=2,col=2,name="Activités")
fig.update_yaxes(title="km",row=1,col=1)
fig.update_yaxes(title="min/km", tickformat="%M:%S",row=1,col=2)
fig.update_yaxes(tickformat="%dj %H:%M:%S",row=2,col=1)

external_stylesheets = ['https://codepen.io/chriddyp/pen/bWLwgP.css']
app = dash.Dash(__name__, external_stylesheets=[external_stylesheets,dbc.themes.BOOTSTRAP])


app.layout = dbc.Container([
    dbc.Container([
        html.H1(children='Runkeeper Data'),
        html.H2(children='Statistiques provenant de Runkeeper')
    ]),

    dbc.Row(
        [
            dbc.Col(
                [
                    dbc.Row(
                        [
                            dbc.Col(
                                dbc.Form(
                                    [
                                        dbc.FormGroup(
                                            [
                                                dbc.Label("Statistiques", html_for="stat-rd"),
                                                dbc.RadioItems(
                                                    id='stat-rd',
                                                    options=[ { 'label':v['label'], 'value':k } for k,v in statistiques.items() ],
                                                    value='S',
                                                    labelStyle={'display': 'block'}
                                                )
                                            ]
                                        )
                                    ]
                                ),
                                width=6
                            ), # col form stat
                            dbc.Col(
                                dbc.Form(
                                    [
                                        dbc.FormGroup(
                                            [
                                                dbc.Label("Par", html_for="time-rd"),
                                                dbc.RadioItems(
                                                    id='time-rd',
                                                    options=[
                                                        {'label':'Activité', 'value':'A'},
                                                        {'label':'Semaine', 'value':'S'},
                                                        {'label':'Mois', 'value':'M'},
                                                        {'label':'Année', 'value':'Y'}
                                                    ],
                                                    value='A'
                                                )
                                            ]
                                        )       
                                    ]
                                ),
                                width=6
                            )
                        ], # cols first row
                        form=True
                    ),
                    dbc.Row(
                        [
                            dbc.Col(
                                dbc.Form(
                                    [
                                        dbc.FormGroup(
                                            [
                                                dbc.Label("Moyenne:", html_for="mean-ck"),
                                                dbc.Checklist(
                                                    id='mean-ck',
                                                    options=[{'label':'Moyenne sur:','value':'mean'}],
                                                    value=[]
                                                ),
                                            ]
                                        ),
                                        dbc.FormGroup(
                                            [
                                                dbc.Label("Fenêtre:", html_for="mean-sl"),
                                                dcc.Slider(
                                                    id='mean-sl',
                                                    min=1,
                                                    max=15,
                                                    marks={i:str(i) for i in range(1,16)},
                                                    value=3,
                                                    disabled=True
                                                )
                                            ]
                                        )
                                    ]
                                ),
                                width=12
                            )
                        ]
                    )
                ],
                width=4
            ),
            dbc.Col(dcc.Graph(id='example-graph'),width=8)
        ],
        align='center'
    ),

    dbc.Row([
        dbc.Col(
            dcc.Graph(
                id='categories-graph',
                figure={
                    'data':[
                        {
                            'type':'pie',
                            'labels':df['Categorie']
                        }
                    ],
                    'layout': {
                        'title':'Categories'
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
    ]),

    dbc.Row(
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
                width=4
            ),
            dbc.Col(
                dbc.FormGroup([
                    dbc.Label("Filtre:", html_for="filter-in"),
                    dbc.Input(id='filter-in')
                ]),
                width=8
            )
        ],
        form=True
    ),

    dash_table.DataTable(
        id='table',
        columns=[{ 'name':v['name'], 'id':k} for k,v in tables.items()],
        data=df.to_dict('records'),
        row_selectable='single',
        page_current=0,
        page_size=pageSize,
        page_action='custom',
        sort_action='custom',
        sort_mode='single',
        sort_by=[]
    ),

    dbc.Modal(
        [
            dbc.ModalHeader("Header",id="modal-header"),
            dbc.ModalBody("Body",id="modal-body"),
            dbc.ModalFooter(
                dbc.Button("Close", id="close", className="ml-auto")
            ),
        ],
        id="modal",
        scrollable=True,
        backdrop='static',
        size="xl"
    )
])

@app.callback(
    [dash.dependencies.Output('modal','is_open'),
     dash.dependencies.Output('modal-header','children'),
     dash.dependencies.Output('modal-body','children')],
    [dash.dependencies.Input('table','selected_rows'),
     dash.dependencies.Input('close','n_clicks')],
    [dash.dependencies.State('modal','is_open'),
     dash.dependencies.State('table','data')]
)
def displayModal(rows,n,is_open,dff):
    if is_open or not rows:
        return [False,"",""]
    if not dff[rows[0]]['GPX File']:
        return [True,"Course du " + dff[rows[0]]['Date_str'], "Pas de données pour cette course..."]

    gpx_file = open('runkeeper-data/'+dff[rows[0]]['GPX File'],'r')
    gpx = gpxpy.parse(gpx_file)
    track = gpx.tracks[0]
    datamap=[]
    for seg in track.segments:
        d = {'type':'scattermapbox','mode':'markers+lines'}
        d['lon'] = list(map(lambda trkpt: trkpt.longitude, seg.points))
        d['lat'] = list(map(lambda trkpt: trkpt.latitude, seg.points))
        datamap.append(d)
        datamap.append({'type':'scattermapbox','mode':'markers','lon':[seg.points[0].longitude],'lat':[seg.points[0].latitude],'marker':{'size':8,'color':'green'}})
        datamap.append({'type':'scattermapbox','mode':'markers','lon':[seg.points[-1].longitude],'lat':[seg.points[-1].latitude],'marker':{'size':8,'color':'red'}})

    graph = dcc.Graph(
        id='map',
        figure={
            'data': datamap,
            'layout': {
                'mapbox': {
                    'style':'basic',
                    'accesstoken':token,
                    'center': {
                        'lat':track.get_bounds().min_latitude+(track.get_bounds().max_latitude-track.get_bounds().min_latitude)/2,
                        'lon':track.get_bounds().min_longitude+(track.get_bounds().max_longitude-track.get_bounds().min_longitude)/2
                    },
                    'zoom':13
                },
                'showlegend':False
            }
        }
    )
    return [True, "Course du " + dff[rows[0]]['Date_str'], graph]

@app.callback(
    [dash.dependencies.Output('table', 'data'),
     dash.dependencies.Output('table','selected_rows')],
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
    ].to_dict('records'),[]]


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

@app.callback(
    dash.dependencies.Output('mean-sl','disabled'),
    [dash.dependencies.Input('mean-ck','value')]
)
def setMeanValue(mean):
    return not 'mean' in mean
    
@app.callback(
    dash.dependencies.Output('example-graph','figure'),
    [dash.dependencies.Input('time-rd','value'),
     dash.dependencies.Input('mean-sl','value'),
     dash.dependencies.Input('mean-sl','disabled')
    ],
    [dash.dependencies.State('stat-rd','value')]
)
def update_graph(time,window,mean,stat):
    dft = dff[time]
    x = dft["Date"] if time == 'A' else dft.index.to_timestamp()
    data = [{'x':x, 'type':'bar'}]
    y = dft[statistiques[stat]['key']]
    if time != 'A':
        y = y[statistiques[stat]['agg']]
    layout = {
        'showlegend':False,
        'xaxis': {
            'type':'date',
            'rangeslider': {'visible':True}
        },
        "yaxis": { "title":statistiques[stat]['unit'] },
        'margin':{'r':0,'t':50}
    }
    if stat == "R":
        y1 = y+pd.to_datetime('1970/01/01')
        layout['yaxis']['tickformat'] = "%M:%S"
    elif stat == "Dum":
        y1 = y+pd.to_datetime('1970/01/01')
        layout['yaxis']['tickformat'] = "%H:%M:%S"
    elif stat == "Dut":
        y1 = y+pd.to_datetime('1970/01/01')
        layout['yaxis']['tickformat'] = "%dj %H:%M:%S"
    else:
        y1 = y
    data[0]['y'] = y1
    if not mean:
        if stat == "R" or "Du" in stat:
            yy = pd.to_timedelta(y.dt.total_seconds().rolling(window=window,center=True).mean(),unit='s')+pd.to_datetime('1970/01/01')
        else:
            yy = y.rolling(window=window,center=True).mean()
        data.append({'x':x,'y':yy})
    return {
        'data': data,
        'layout': layout
    }

if __name__ == '__main__':
    app.run_server(debug=True)
    
