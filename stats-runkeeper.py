#!/usr/bin/env python
# coding: utf-8

# In[44]:


import pandas as pd
import numpy as np
import scipy as sp
import plotly.express as px
import plotly.graph_objects as go
from plotly.subplots import make_subplots
df = pd.read_csv("cardioActivities.csv")
df["Date"] = pd.to_datetime(df["Date"])
df["Duration"] = df["Duration"].apply(lambda x: "00:"+x if x.count(':') < 2 else x)
df["Duration"] = pd.to_timedelta(df["Duration"])
df["Average Pace"] = df["Average Pace"].apply(lambda x: "00:"+x if x.count(':') < 2 else x)
df["Average Pace"] = pd.to_timedelta(df["Average Pace"])
cat=["0-4","4-8","8-12","12-16","16-20"]
df["Categorie"] = (4*(df["Distance (km)"]//4)).astype(int).astype(str)+"-"+(4*(1+df["Distance (km)"]//4)).astype(int).astype(str)
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
#df.head()


# In[54]:


fig = go.Figure()
fig.add_bar(x=df["Date"],y=df["Distance (km)"])
fig.add_bar(x=dfw.index.to_timestamp(),y=dfw["Distance (km)"]["sum"],visible=False)
fig.add_bar(x=dfm.index.to_timestamp(),y=dfm["Distance (km)"]["sum"],visible=False)
fig.add_bar(x=dfy.index.to_timestamp(),y=dfy["Distance (km)"]["sum"],visible=False)
fig.update_layout(
    xaxis_rangeslider_visible=True,
    xaxis_type="date",
    yaxis_title="km",
    title="Distance totale",
    updatemenus = [dict(
        x = 1,
        y = 1.15,
        yanchor = 'top',
        active = 0,
        showactive = True,
        buttons = [
        dict(
            args = ['visible', [i == 0 for i in range(0,4)]],
            label = 'Activité',
            method = 'restyle',
        ), dict(
            args = ['visible', [i == 1 for i in range(0,4)]],
            label = 'Semaine',
            method = 'restyle',
        ), dict(
            args = ['visible', [i == 2 for i in range(0,4)]],
            label = 'Mois',
            method = 'restyle',
        ), dict(
            args = ['visible', [i == 3 for i in range(0,4)]],
            label = 'Année',
            method = 'restyle',
        )
        ]
    )]
)
fig.write_html("distance_tot.html",include_plotlyjs='cdn')
fig


# In[55]:


fig = go.Figure()
fig.add_bar(x=dfw.index.to_timestamp(),y=dfw["Distance (km)"]["mean"])
fig.add_bar(x=dfm.index.to_timestamp(),y=dfm["Distance (km)"]["mean"],visible=False)
fig.add_bar(x=dfy.index.to_timestamp(),y=dfy["Distance (km)"]["mean"],visible=False)
fig.update_layout(
    xaxis_rangeslider_visible=True,
    xaxis_type="date",
    yaxis_title="km",
    title="Distance moyenne",
    updatemenus = [dict(
        x = 1,
        y = 1.15,
        yanchor = 'top',
        active = 0,
        showactive = True,
        buttons = [
        dict(
            args = ['visible', [i == 0 for i in range(0,3)]],
            label = 'Semaine',
            method = 'restyle',
        ), dict(
            args = ['visible', [i == 1 for i in range(0,3)]],
            label = 'Mois',
            method = 'restyle',
        ), dict(
            args = ['visible', [i == 2 for i in range(0,3)]],
            label = 'Année',
            method = 'restyle',
        )
        ]
    )]
)
fig.write_html("distance_moyenne.html",include_plotlyjs='cdn')
fig


# In[56]:


fig = go.Figure()
fig.add_bar(x=df["Date"],y=df["Average Pace"]+pd.to_datetime('1970/01/01'))
fig.add_bar(x=dfw.index.to_timestamp(),y=dfw["Average Pace"]["mean"]+pd.to_datetime('1970/01/01'),visible=False)
fig.add_bar(x=dfm.index.to_timestamp(),y=dfm["Average Pace"]["mean"]+pd.to_datetime('1970/01/01'),visible=False)
fig.add_bar(x=dfy.index.to_timestamp(),y=dfy["Average Pace"]["mean"]+pd.to_datetime('1970/01/01'),visible=False)
fig.update_layout(
    xaxis_rangeslider_visible=True,
    xaxis_type="date",
    yaxis_title="min/km",
    title="Rythme",
    updatemenus = [dict(
        x = 1,
        y = 1.15,
        yanchor = 'top',
        active = 0,
        showactive = True,
        buttons = [
        dict(
            args = ['visible', [i == 0 for i in range(0,4)]],
            label = 'Activité',
            method = 'restyle',
        ), dict(
            args = ['visible', [i == 1 for i in range(0,4)]],
            label = 'Semaine',
            method = 'restyle',
        ), dict(
            args = ['visible', [i == 2 for i in range(0,4)]],
            label = 'Mois',
            method = 'restyle',
        ), dict(
            args = ['visible', [i == 3 for i in range(0,4)]],
            label = 'Année',
            method = 'restyle',
        )
        ]
    )]
)
fig.write_html("rythme.html",include_plotlyjs='cdn')
fig


# In[59]:


fig = go.Figure()
fig.add_bar(x=df["Date"],y=df["Duration"]+pd.to_datetime('1970/01/01'))
fig.add_bar(x=dfw.index.to_timestamp(),y=dfw["Duration"]["sum"]+pd.to_datetime('1970/01/01'),visible=False)
fig.add_bar(x=dfm.index.to_timestamp(),y=dfm["Duration"]["sum"]+pd.to_datetime('1970/01/01'),visible=False)
fig.add_bar(x=dfy.index.to_timestamp(),y=dfy["Duration"]["sum"]+pd.to_datetime('1970/01/01'),visible=False)
fig.update_layout(
    xaxis_rangeslider_visible=True,
    xaxis_type="date",
    yaxis_tickformat="%dj %H:%M:%S",
    title="Durée totale",
    updatemenus = [dict(
        x = 1,
        y = 1.15,
        yanchor = 'top',
        active = 0,
        showactive = True,
        buttons = [
        dict(
            args = ['visible', [i == 0 for i in range(0,4)]],
            label = 'Activité',
            method = 'restyle',
        ), dict(
            args = ['visible', [i == 1 for i in range(0,4)]],
            label = 'Semaine',
            method = 'restyle',
        ), dict(
            args = ['visible', [i == 2 for i in range(0,4)]],
            label = 'Mois',
            method = 'restyle',
        ), dict(
            args = ['visible', [i == 3 for i in range(0,4)]],
            label = 'Année',
            method = 'restyle',
        )
        ]
    )]
)
fig.write_html("duree_tot.html",include_plotlyjs='cdn')
fig


# In[57]:


fig = go.Figure()
fig.add_bar(x=dfw.index.to_timestamp(),y=dfw["Duration"]["mean"]+pd.to_datetime('1970/01/01'))
fig.add_bar(x=dfm.index.to_timestamp(),y=dfm["Duration"]["mean"]+pd.to_datetime('1970/01/01'),visible=False)
fig.add_bar(x=dfy.index.to_timestamp(),y=dfy["Duration"]["mean"]+pd.to_datetime('1970/01/01'),visible=False)
fig.update_layout(
    xaxis_rangeslider_visible=True,
    xaxis_type="date",
    yaxis_tickformat="%H:%M:%S",
    title="Durée moyenne",
    updatemenus = [dict(
        x = 1,
        y = 1.15,
        yanchor = 'top',
        active = 0,
        showactive = True,
        buttons = [
        dict(
            args = ['visible', [i == 0 for i in range(0,3)]],
            label = 'Semaine',
            method = 'restyle',
        ), dict(
            args = ['visible', [i == 1 for i in range(0,3)]],
            label = 'Mois',
            method = 'restyle',
        ), dict(
            args = ['visible', [i == 2 for i in range(0,3)]],
            label = 'Année',
            method = 'restyle',
        )
        ]
    )]
)
fig.write_html("duree_moyenne.html",include_plotlyjs='cdn')
fig


# In[60]:


fig = go.Figure()
fig.add_bar(x=dfw.index.to_timestamp(),y=dfw["Duration"]["count"])
fig.add_bar(x=dfm.index.to_timestamp(),y=dfm["Duration"]["count"],visible=False)
fig.add_bar(x=dfy.index.to_timestamp(),y=dfy["Duration"]["count"],visible=False)
fig.update_layout(
    xaxis_rangeslider_visible=True,
    xaxis_type="date",
    title="Activités",
    updatemenus = [dict(
        x = 1,
        y = 1.15,
        yanchor = 'top',
        active = 0,
        showactive = True,
        buttons = [
        dict(
            args = ['visible', [i == 0 for i in range(0,3)]],
            label = 'Semaine',
            method = 'restyle',
        ), dict(
            args = ['visible', [i == 1 for i in range(0,3)]],
            label = 'Mois',
            method = 'restyle',
        ), dict(
            args = ['visible', [i == 2 for i in range(0,3)]],
            label = 'Année',
            method = 'restyle',
        )
        ]
    )]
)
fig.write_html("activite.html",include_plotlyjs='cdn')
fig


# In[51]:


fig = go.Figure()
fig.add_pie(labels=df["Categorie"])
fig.update_layout(
    title="Categories"
)
fig.write_html("categories.html",include_plotlyjs='cdn')
fig


# In[52]:


fig = make_subplots(rows=2, cols=2, subplot_titles=("Distance", "Rythme", "Durée", "Activités"))
fig.add_bar(x=dfc.index,y=dfc["Distance (km)"]["sum"],row=1,col=1,name="Distance")
fig.add_bar(x=dfc.index,y=dfc["Average Pace"]["mean"]+ pd.to_datetime('1970/01/01'),row=1,col=2,name='Rythme')
fig.add_bar(x=dfc.index,y=dfc["Duration"]["sum"]+pd.to_datetime('1970/01/01'),row=2,col=1,name="Durée")
fig.add_bar(x=dfc.index,y=dfc["Duration"]['count'],row=2,col=2,name="Activités")
fig.update_yaxes(title="km",row=1,col=1)
fig.update_yaxes(title="min/km", tickformat="%M:%S",row=1,col=2)
fig.update_yaxes(tickformat="%dj %H:%M:%S",row=2,col=1)
fig.write_html("bycategorie.html",include_plotlyjs='cdn')
fig


# In[ ]:




