# Web page to display statistics on Runkeeper data

First, install plotly, with for example conda:

    conda create -n runkeeper python="3.8"
    conda activate runkeeper
    conda install -c plotly -c conda-forge plotly numpy pandas scipy plotly chart-studio dash dash-bootstrap-components gpxpy

You also have to get a token from mapbox.com, it is free, and store it in a file called `.mapbox_token`.

Then get the address to download your data in your Runkeeper account, and run

    ./dl-data <address>

And launch the app with

    python app.py

which should give an address to visit with your browser where you have the different graphs and table.

![Activities](activity.png)

![Modal](modal.png)
