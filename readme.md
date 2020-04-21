# Web page to display statistics on Runkeeper data

First, install plotly, with for example conda:

    conda create -n runkeeper-data python="3.8"
    conda activate runkeeper-data
    conda install -c plotly numpy pandas scipy plotly chart_studio

then get the address to download your data in your Runkeeper account, and run

    ./dl-data <address>

This will generate html files using plotly for the graphs, a javascript file for the table and a php file to access them.

Alternatively, you can watch the graphs using the jupyter notebook.

A graph look like this:

![Rythme](rythme.png)

The searchable table, where each row can display the map:

![Table](table.png)
