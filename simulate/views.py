from django.http import HttpResponse
from django.shortcuts import render, redirect
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
        request.session['SimulationData'] = json.loads(request.body)
        request.session.save()
        return HttpResponse('')

    return render(request, 'simulate/input.html', {})

def SimulationResult(request):

    data = deepcopy(request.session['SimulationData'])
    del request.session['SimulationData']


    # Will clean the data so numbers are int

    for player in data["data"]["PlayerList"]:
        player["playerID"] = int(player["playerID"])
        for key in player["stat"]:
            player["stat"][key] = int(player["stat"][key])

        for action in player["actionList"]:
            if action["actionName"] == "WaitAbility":
                action["waitTime"] = float(action["waitTime"])

    # Will add missing data.
    data["data"]["fightInfo"]["fightDuration"] = 500
    data["data"]["fightInfo"]["time_unit"] = 0.01
    data["data"]["fightInfo"]["ShowGraph"] = False

    if not attachmentValidation(data): # If fails the validation, we stop here.
        return redirect('FailedValidation') 

    request.session["JSONFileViewer"] = json.dumps(data, indent=2) # Leaving the data in the session if the user wants to see it.

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

def JSONFileViewer(request):
    return render(request, 'simulate/JSONFileViewer.html', {'JSONFileStr' : request.session["JSONFileViewer"]})

def FailedValidation(request):
    return render(request, 'simulate/FailedValidation.html')

def attachmentValidation(data : dict) -> bool:
    """This function validates the JSON file given to the bot.

    Args:
        data (dict): Data the bot received.

    Returns:
        bool: True if the validation is succesful.
    """
    
    if not(checkNameAndType(data, ["data"], [dict])):
        return False
    
    if not(checkNameAndType(data["data"], ["PlayerList","fightInfo"], [list, dict])):
        return False

    if not(checkNameAndType(data["data"]["fightInfo"], ["IgnoreMana", "RequirementOn", "ShowGraph","fightDuration",  "time_unit"], 
                                                       [bool, bool, bool, int, float])):
        return False

    for player in data["data"]["PlayerList"]:
        if type(player) != dict:
            return False
        
        if not(checkNameAndType(player, ["Auras", "JobName","PlayerName","actionList",  "etro_gearset_url", "playerID", "stat"],
                                        [list, str, str, list, str, int, dict])):
            return False

        if not(checkNameAndType(player["stat"], ["Crit", "DH", "Det", "MainStat", "SS", "SkS", "Ten", "WD"],
                                                [int, int, int, int, int, int, int, int])):
            return False
        
        for action in player["actionList"]:
            if not(checkNameAndType(action, ["actionName"], [str]) or 
                   checkNameAndType(action, ["actionName", "waitTime"], [str, float]) or
                   checkNameAndType(action, ["actionName", "waitTime"], [str, int])):
                return False
    return True

def checkNameAndType(dict : dict, ExpectedKeyName : list, ExpectedType : list) -> bool:
    """This function checks the dictionnary and valditates the key's name and their types. It returns
    True if the dictionnary is validated and false otherwise

    dict : The dictionnary to verify.
    ExpectedKeyName : The expected name of the dictionnary's keys. Must be sorted in alphabetical order.
    ExpectedType : The expected type of the dictionnary's entry. In the same order as ExpectedKeyName.
    """

    # Check Key's name
    nameList = list(dict.keys())
    nameList.sort()
    if nameList != ExpectedKeyName:
        return False
    
    # Will check the type
    index = 0
    for name in ExpectedKeyName:
        if type(dict[name]) != ExpectedType[index]:
            return False
        index +=1

    return True
index(None)