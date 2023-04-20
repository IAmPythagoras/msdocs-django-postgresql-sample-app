from django.http import HttpResponse
from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt
import io
import matplotlib.pyplot as plt
import json
from copy import deepcopy
import base64, urllib
#import logging

#logging.basicConfig(filename='log.log')
#logging.getLogger("ffxivcalc").setLevel(level=logging.DEBUG)

from ffxivcalc.helperCode import helper_backend

def index(request):
    return render(request, 'simulate/index.html', {})
@csrf_exempt
def SimulationInput(request):
    if request.method == "POST":
        #print(json.loads(request.body))
        request.session['SimulationData'] = json.loads(request.body)
        #print(request.session['SimulationData'])
        request.session.save()
        print("1")
        return HttpResponse('')

    return render(request, 'simulate/input.html', {})

def SimulationResult(request):
    print(request.session['SimulationData'])
    print("2")

    data = deepcopy(request.session['SimulationData'])
    del request.session['SimulationData']


    # Will clean the data so numbers are int

    for player in data["data"]["PlayerList"]:
        for key in player["stat"]:
            player["stat"][key] = int(player["stat"][key])

        for action in player["actionList"]:
            if action["actionName"] == "WaitAbility":
                action["waitTime"] = float(action["waitTime"])

    # Will add missing data.
    data["data"]["fightInfo"]["fightDuration"] = 500
    data["data"]["fightInfo"]["time_unit"] = 0.01
    data["data"]["fightInfo"]["ShowGraph"] = False

    Event = helper_backend.RestoreFightObject(data)
    # Restores the data as an Event object

    Event.ShowGraph = data["data"]["fightInfo"]["ShowGraph"]
    Event.RequirementOn = False#data["data"]["fightInfo"]["RequirementOn"]
    Event.IgnoreMana = data["data"]["fightInfo"]["IgnoreMana"]
    
    result_str, fig = Event.SimulateFight(0.01,data["data"]["fightInfo"]["fightDuration"], vocal=False)


    # To make the template better, every element of result_arr will contain 1 line to show in the website.
    result_arr = []

    for line in result_str.split("\n"):
        result_arr.append(line)
    fig = plt.gcf()
    buf = io.BytesIO()
    fig.savefig(buf, format='png', dpi=200)
    buf.seek(0)
    string = base64.b64encode(buf.read())
    uri = urllib.parse.quote(string)

    return render(request, 'simulate/SimulatingResult.html', {"result_str" : result_arr, "graph" : uri})

def results(request):
    return render(request, '', {})

def credit(request):
    return render(request, 'simulate/credit.html', {})
index(None)