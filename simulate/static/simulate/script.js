
var PlayerConfigDict = new Object();
var nextPlayerID = 0;
var currentEditPlayerID = 0;
var AtLeastOnePlayer = false; // Will let the code know if at least 1 player is was created.
// This dict will hold every player config info.
// Every key will represent a player id that is given when adding
// a new player.

function Submit(){

if (! AtLeastOnePlayer){alert("You cannot simulate if you have no player!");return;}

SavePlayerConfiguration(currentEditPlayerID); // Saving since only saves once change player.
                                                // So chance it hasn't been saved

var FightInfo = {
    "RequirementOn": document.getElementById("RequirementOnCheckBox").checked,
    "IgnoreMana": document.getElementById("RequirementOnCheckBox").checked
}

var PlayerList = []

for (let key in PlayerConfigDict){
    PlayerDict = PlayerConfigDict[key];

    var actionList = [];

    for (let i in PlayerDict["ActionList"]){
        var action = PlayerDict["ActionList"][i];
        if (action["Action"] == 'wait_ability'){
            var nextAction = {
                "actionName" : "WaitAbility",
                "waitTime" : action["WaitTime"]
            };
        } else {
            var nextAction = {
                "actionName" : action["Action"],
            }
        }

        if (action["target"] != -1){nextAction["targetID"] = action["target"]}
        actionList.push(nextAction);
    }
    if (actionList.length == 0){alert("Every player must have at least one action. Currently the player " + PlayerDict["PlayerName"] + " has no actions.");return;}
    var PlayerConfig = {
        "JobName" : PlayerDict["Job"],
        "PlayerName" : PlayerDict["PlayerName"],
        "playerID" : key,
        "stat" : PlayerDict["Stat"],
        "actionList" : actionList,
        "etro_gearset_url" : PlayerDict["etro_gearset_url"],
        "Auras": []
    }

    PlayerList.push(PlayerConfig);

}

var dataDict = {"data" : {
    "fightInfo" : FightInfo,
    "PlayerList" : PlayerList
}};

xhr = new XMLHttpRequest();
var url = "/simulate/SimulationInput/";
xhr.open("POST", url, true);
xhr.setRequestHeader("Content-type", "application/json");
xhr.onreadystatechange = function () { 
    if (xhr.readyState == 4 && xhr.status == 200) {
        var json = JSON.parse(xhr.responseText);
    }
}
var data = JSON.stringify(dataDict);
xhr.onreadystatechange = function() {
if (xhr.readyState == XMLHttpRequest.DONE && xhr.status == 200) {
    window.location.href='/simulate/SimulationResult/'
}
}
xhr.send(data);

}

function addNewPlayer() {
if (! AtLeastOnePlayer){currentEditPlayerID = nextPlayerID;}// This is to make sure the LoadPlayer function does not load a player that does not exist
AtLeastOnePlayer = true;
PlayerConfigDict[nextPlayerID] = {
    "PlayerName" : "Player" + nextPlayerID,
    "PlayerID" : nextPlayerID, // This value is non-editable.
    "NextActionIndex" : 0,
    "NextActionID" : 0,
    "Job" : "BlackMage", // Defaults to BlackMage
    "etro_gearset_url" : "",
    "Stat" : {
        "MainStat" : 390,
        "WD" : 400,
        "Det" : 400,
        "Ten" : 400,
        "SS" : 400,
        "SkS" : 400,
        "Crit" : 400,
        "DH" : 400
    },
    "ActionList" :[]
}

const boxWrapper = document.getElementById("PlayerRosterViewer");
const box = document.createElement("div");
box.setAttribute("id", "Edit"+nextPlayerID);
box.innerHTML = '<p id="Player'+nextPlayerID+'Name">'+PlayerConfigDict[nextPlayerID]["PlayerName"]+'</p><button class="basicButton" onclick="LoadPlayerConfiguration('+nextPlayerID+')">Edit</button><button class ="basicButton" style="background-color: red;position:relative;left:250px;" onclick="DeletePlayer('+nextPlayerID+')">Delete</button></div>';
box.style = "background-color: #333;border-radius: 5px;"
boxWrapper.appendChild(box);
nextPlayerID++;
}

function DeletePlayer(PlayerID){
    // This function removes a player from the simulation input.
    // It will ask for a prompt from the user to make sure the action was
    // deliberate.

    const confirmation = confirm("Are you sure you want to delete the player : " + String(PlayerConfigDict[PlayerID]["PlayerName"]) + "?");

    if (! confirmation){return;} // If not confirmed, we exit

    document.getElementById("Edit"+String(PlayerID)).remove()

    delete PlayerConfigDict[PlayerID];

    for (let id in PlayerConfigDict){
        currentEditPlayerID = id;
        LoadPlayerConfiguration(id, save=false);
        return; // Load any first other player and returns
    }

    // If we're here there were no other players. So we will clear the screen.
    AtLeastOnePlayer = false;
    document.getElementById("ActionListPick").innerHTML = "";
    document.getElementById("PlayerActionListViewer").innerHTML = "";//Wiping

}

function UpdateName(){
document.getElementById('Player'+currentEditPlayerID+'Name').innerHTML = document.getElementById("PlayerName").value;
}

function GetTarget(){

var TargetID = prompt("Enter the PlayerID of who you want to target with this ability");

return TargetID;

}

function LoadPlayerConfiguration(PlayerID, save=true){

if (save){SavePlayerConfiguration(currentEditPlayerID);}
const box = document.getElementById('Player'+currentEditPlayerID+'Name')
box.innerHTML = PlayerConfigDict[currentEditPlayerID]["PlayerName"]
document.getElementById("Edit"+PlayerID).setAttribute("style","background-color: #333;border-radius: 5px;border: 3px solid white;")
document.getElementById("Edit"+currentEditPlayerID).setAttribute("style","background-color: #333;border-radius: 5px;border: 0px solid white;")
currentEditPlayerID = PlayerID;

document.getElementById("PlayerName").value = PlayerConfigDict[PlayerID]["PlayerName"];
document.getElementById("Job").value = PlayerConfigDict[PlayerID]["Job"];
document.getElementById("MainStat").value = PlayerConfigDict[PlayerID]["Stat"]["MainStat"];
document.getElementById("Crit").value = PlayerConfigDict[PlayerID]["Stat"]["Crit"];
document.getElementById("DH").value = PlayerConfigDict[PlayerID]["Stat"]["DH"];
document.getElementById("WD").value = PlayerConfigDict[PlayerID]["Stat"]["WD"];
document.getElementById("SkS").value = PlayerConfigDict[PlayerID]["Stat"]["SkS"];
document.getElementById("SpS").value = PlayerConfigDict[PlayerID]["Stat"]["SS"];
document.getElementById("Det").value = PlayerConfigDict[PlayerID]["Stat"]["Det"];
document.getElementById("Ten").value = PlayerConfigDict[PlayerID]["Stat"]["Ten"];
document.getElementById("etroURL").value = PlayerConfigDict[PlayerID]["etro_gearset_url"];
document.getElementById("PlayerIDField").innerHTML = "PlayerID : " + PlayerConfigDict[currentEditPlayerID]["PlayerID"];

document.getElementById("ActionListPick").innerHTML = "";
document.getElementById("PlayerActionListViewer").innerHTML = "";//Wiping
PlayerConfigDict[currentEditPlayerID]["NextActionID"] = 0;
LoadPlayerActionsPick();
LoadPlayerActionList();
}

function LoadPlayerActionList(){
var ActionList = PlayerConfigDict[currentEditPlayerID]["ActionList"];

for (let i = 0;i<ActionList.length;i++){
    CreateAddAction(ActionList[i]["Action"], false, false,IsAdded = false, ActionIden = ActionList[i]["ActionID"])();
}
}

function DelActionFromList(ActionID){

function delAction(){
    document.getElementById(ActionID).remove();
    var ActionList = PlayerConfigDict[currentEditPlayerID]["ActionList"]
    for (let i = 0;i<ActionList.length;i++){
        if (ActionList[i]["ActionID"] == ActionID)
            {
            var action = ActionList[i];
            break;
            }
    }

    for(let i = action["IndexInList"]+1;i<ActionList.length;i++){
        ActionList[i]["IndexInList"]--;
    }
    PlayerConfigDict[currentEditPlayerID]["ActionList"].splice(action["IndexInList"],1);
}

return delAction;

}

function CreateAddAction(ActionID, SpecifyTarget, WaitAbility, IsAdded = true, ActionIden = -1){

function AddActionToPlayer(){
const ActionListViewer = document.getElementById("PlayerActionListViewer");
PlayerJob = PlayerConfigDict[currentEditPlayerID]["Job"];
if (ActionIden == -1){
    ActionIden = String(currentEditPlayerID)+String(PlayerConfigDict[currentEditPlayerID]["NextActionID"]);
    PlayerConfigDict[currentEditPlayerID]["NextActionID"]++;
}
const newAction = document.createElement('div');
newAction.innerHTML = '<img src="/static/simulate/PVEIcons/'+PlayerJob+'/'+ActionID+'.png" width="40px" height="40px" class="Icon">';
newAction.onclick = DelActionFromList(ActionIden);
newAction.setAttribute("id", ActionIden);
ActionListViewer.appendChild(newAction);
if (IsAdded) {
    ActionDict = {
    "Action" : ActionID,
    "ActionID" : ActionIden, 
    "IndexInList" : PlayerConfigDict[currentEditPlayerID]["NextActionIndex"],
    "target" : SpecifyTarget ? GetTarget() : -1
    };
    if (WaitAbility){ActionDict["WaitTime"] = prompt("Input how long (in seconds) you want the player to wait for :");}
    PlayerConfigDict[currentEditPlayerID]["ActionList"].push(ActionDict);
}
PlayerConfigDict[currentEditPlayerID]["NextActionIndex"]++;
PlayerConfigDict[currentEditPlayerID]["NextActionID"]++;

}

return AddActionToPlayer;

}

function SavePlayerConfiguration(PlayerID){
PlayerConfigDict[PlayerID]["PlayerName"] = document.getElementById("PlayerName").value;
PlayerConfigDict[PlayerID]["Job"] = document.getElementById("Job").value;
PlayerConfigDict[PlayerID]["Stat"]["MainStat"] = document.getElementById("MainStat").value;
PlayerConfigDict[PlayerID]["Stat"]["Crit"] = document.getElementById("Crit").value;
PlayerConfigDict[PlayerID]["Stat"]["DH"] = document.getElementById("DH").value;
PlayerConfigDict[PlayerID]["Stat"]["WD"] = document.getElementById("WD").value;
PlayerConfigDict[PlayerID]["Stat"]["SkS"] = document.getElementById("SkS").value;
PlayerConfigDict[PlayerID]["Stat"]["SS"] = document.getElementById("SpS").value;
PlayerConfigDict[PlayerID]["Stat"]["Det"] = document.getElementById("Det").value;
PlayerConfigDict[PlayerID]["Stat"]["Ten"] = document.getElementById("Ten").value;
PlayerConfigDict[PlayerID]["etro_gearset_url"] = document.getElementById("etroURL").value;
}

function LoadPlayerActionsPick(ChangingJob=false){

document.getElementById("ActionListPick").innerHTML = "";//Wiping
PlayerConfigDict[currentEditPlayerID]["Job"] = document.getElementById("Job").value;
var PlayerJob = PlayerConfigDict[currentEditPlayerID]["Job"];
if (ChangingJob){
    PlayerConfigDict[currentEditPlayerID]['ActionList'] = [];
    document.getElementById("PlayerActionListViewer").innerHTML = "";
} //wiping if changing job
var IconNameList = IconDict[PlayerJob];
const box = document.getElementById("ActionListPick");
for (var i = 0;i<IconNameList.length;i++){
    const newBox = document.createElement("div");
    var t = '<img src="/static/simulate/PVEIcons/'+PlayerJob+'/'+IconNameList[i]+'.png" width="60px" height="60px" class="Icon" role="button">';
    var insideHTML = t
    newBox.innerHTML = insideHTML;
    newBox.onclick = CreateAddAction(IconNameList[i],(TargetActionList.includes(IconNameList[i])),(IconNameList[i] == "wait_ability") );
    box.appendChild(newBox);
}

}
