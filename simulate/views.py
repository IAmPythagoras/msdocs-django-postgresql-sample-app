from django.http import HttpResponse
from django.shortcuts import render, redirect
from django.views.decorators.csrf import csrf_exempt
import io
import matplotlib.pyplot as plt
import json
from copy import deepcopy
import base64, urllib
from .Validation import attachmentValidation
import logging
from ffxivcalc.helperCode import helper_backend
from .Stream import LogStream
log_stream = LogStream()
logging.basicConfig(stream=log_stream)
#logging.getLogger("ffxivcalc").setLevel(level=logging.DEBUG)

def index(request):
    """
    This view is the homepage of the website.
    """
    return render(request, 'simulate/index.html', {})

@csrf_exempt                 # Will but csrf_exempt for now, since was causing issues. We are doing validations on the request anyway.
def SimulationInput(request):
    """
    This view lets the user setup the simulation for what they want. It only sends the data and does not simulate.
    """
    if request.method == "POST":
                             # The SimulationInput page will make a POST HTTP request to itself. This will be catched here.
        request.session['SimulationData'] = json.loads(request.body)
                             # The simulation data is saved in the session. The user will now be redirected to the SimulationResult page
        return HttpResponse('200', status=200)
    return render(request, 'simulate/input.html', {})


def SimulationResult(request):
    """
    This view will retrieve the data from the session and simulate the fight. It validates the file before simulating it.
    It then displays the result to the user.
    """
                             # We are recuperating the simulation data, and deleting it.
                             # Deleting it will make sure the data is not reused in the same session
                             # if the user goes back to SimulationInput. We first check if it is a key,
                             # if it is not we redirect to the error page. This error could happen
                             # If there was an error when putting the data in the session, or if
                             # SimulationResult was accessed without first going to SimulationInput.
    if (not "SimulationData" in request.session.keys()):
        Msg = ("The session does not have a 'SimulationData' key, make sure you access this page by first going to 'SimulationInput'. If this issues persists contact me on discord.")
        request.session["ErrorMessage"] = Msg
        return redirect('Error')

    data = deepcopy(request.session['SimulationData'])
    del request.session['SimulationData']
                             # Since some fields from the data were not of the right type, 
                             # we are casting them into the expected type, as they will otherwise
                             # fail the validation.
    data["data"]["fightInfo"]["fightDuration"] = int(data["data"]["fightInfo"]["fightDuration"])
    for player in data["data"]["PlayerList"]:
        player["playerID"] = int(player["playerID"])
        for key in player["stat"]:
            player["stat"][key] = int(player["stat"][key])
        for action in player["actionList"]:
            if action["actionName"] == "WaitAbility":
                action["waitTime"] = float(action["waitTime"])
            if "targetID" in action.keys():
                action["targetID"] = int(action["targetID"])
                             # We are adding data that is willingly not editable by the user
    data["data"]["fightInfo"]["time_unit"] = 0.01
    data["data"]["fightInfo"]["ShowGraph"] = False
                             # We will validate the final dictionnary before reading anything from it.
                             # If it fails, the user is redirected to an Error view with a failed validation message.
    if not attachmentValidation(data):
        Msg = ("There was an error when validating the given data. Either there was a corruption of the data "+
               "or something else happened. If this error persists please let me know through discord.")
        request.session["ErrorMessage"] = Msg
        print(data)
        return redirect('Error') 
                             # We are making a string that represents the whole JSON saved file
                             # since the user can request to see it. Saving it in the session.
    request.session["JSONFileViewer"] = json.dumps(data, indent=2) # Leaving the data in the session if the user wants to see it.

                             # Restoring the fight object from the data
    Event = helper_backend.RestoreFightObject(data)
                             # Configuring the Event object according to the parameters in data
    Event.ShowGraph = data["data"]["fightInfo"]["ShowGraph"]
    Event.RequirementOn = data["data"]["fightInfo"]["RequirementOn"]
    Event.IgnoreMana = data["data"]["fightInfo"]["IgnoreMana"]
                                 # Simulating the fight.
    result_str, fig = Event.SimulateFight(0.01,data["data"]["fightInfo"]["fightDuration"], vocal=False)
                             # result_str contains the result of the simulation.
                             # We will parse it by line in order to show it clearly to the user.
    result_arr = []
    for line in result_str.split("\n"):
        result_arr.append(line)
                             # We will save the generated matplotlib figure
                             # in order to show it to the user.
    fig = plt.gcf()
    buf = io.BytesIO()
    fig.savefig(buf, format='png', dpi=200)
    buf.seek(0)
    string = base64.b64encode(buf.read())
    uri = urllib.parse.quote(string)

                             # We will take the logs if any and check what the ReturnCode value is.
    ReturnCode = log_stream.ReturnCode
    log_str = log_stream.to_str()

    return render(request, 'simulate/SimulatingResult.html', {"result_str" : result_arr, "graph" : uri, "WARNING" : ReturnCode == 1, "CRITICAL" : ReturnCode == 2, "log_str" : log_str})

def credit(request):
    """
    This view is the credits view.
    """
    return render(request, 'simulate/credit.html', {})

def JSONFileViewer(request):
    """
    This view shows the raw JSON data of the simulation. The string to show is in the JSONFileViewer key
    in the session.
    """
    if (not "JSONFileViewer" in request.session.keys()):
        Msg = ("The session does not have a 'JSONFileViewer' key, make sure you access this page by first going to 'SimulationResult'. If this issues persists contact me on discord.")
        request.session["ErrorMessage"] = Msg
        return redirect('Error')
    return render(request, 'simulate/JSONFileViewer.html', {'JSONFileStr' : request.session["JSONFileViewer"]})

def Error(request):
    """
    This view is any error message. It displays the ErrorMessage given to the user. It will display the message
    saved at the key "ErrorMessage" in the session
    """
                             # Check if the session has an error message. If it doesn't
                             # we simply display Error Message. Otherwise we take the message
                             # and remove it from the session.
    ErrorMessage = "Error Message."
    if ("ErrorMessage" in request.session.keys()):
        ErrorMessage = request.session["ErrorMessage"]
        del request.session["ErrorMessage"]
    return render(request, 'simulate/Error.html', {"ErrorMessage" : ErrorMessage})

index(None)