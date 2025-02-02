/* 
GLOBAL VARIABLE DECLARATION
*/                             
                             // PlayerConfigDict will hold in memory all the information inputted by the user
                             // for the simulation. This will be sent as a POST request to the server
                             // when the player wants to simulate.
var PlayerConfigDict = new Object();   
var NumberOfPlayer = 0;
                             // This represents the next given ID to a new player. Every player has a unique ID.
                             // This value is never decremented and is a unique value for every player, but it will be incremented every time we add a player.
var nextPlayerID = 0;
                             // This represents the ID of the player being currently edited.
var currentEditPlayerID = 0;
                             // This flag lets the code know if there is at least one player in the simulation.
                             // It will block the simulation if there are no players.
var AtLeastOnePlayer = false;
                             // These values corresponds to the checkbox in Fight configuration
var RequirementOn = false;
var IgnoreMana = false;
var DebugMode = false;
var ResultNewTab = true;
var TeamCompBonus = false;
var MaxPotencyPlentifulHarvest = false;
                             // Flag to know if we sent a simulation
var InQueue = false;
/* 
GLOBAL VARIABLE DECLARATION END
*/     

/*
VALIDATION FUNCTIONS
*/

function validateWaitTime(UserInput){
    return UserInput == null ||     /* User hit cancel */
           UserInput == ""   ||     /* User did not input anything */
           (!onlyNumbers(UserInput) && !onlyFloat(UserInput)); /* User input has letters */
}

function validateTarget(UserInput){
    return UserInput == null ||                 /* User hit cancel */
           UserInput == ""   ||                 /* User did not input anything */
          !(onlyNumbers(UserInput)) ||          /* User input has letters */
          !(UserInput in PlayerConfigDict) ||   /* User targets a non existing player */
           UserInput == currentEditPlayerID;    /* Player targets itself */
}

/*
FUNCTION INTERACTING WITH WHAT IS DISPLAYED
*/
function addNewPlayer() {
/* 
This function is called when the user wishes the create a new player. It appends to PlayerConfigDict, and adds a new div in the html page.
*/

if (Object.keys(PlayerConfigDict).length >= 8){
    alert("You cannot have more than 8 players.");
    return;
}


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

                             // Adding the new Player division
const boxWrapper = document.getElementById("PlayerRosterViewer");
const box = document.createElement("div");
                             // Every div has a unique ID to access it
box.setAttribute("id", "Edit"+nextPlayerID);
box.innerHTML = '<p id="Player'+nextPlayerID+'Name">'+PlayerConfigDict[nextPlayerID]["PlayerName"]+' ID - '+nextPlayerID+'</p><button class="basicButton" onclick="LoadPlayerConfiguration('+nextPlayerID+')">Edit</button><button class ="basicButton" style="background-color: red;position:absolute;right:5%;" onclick="DeletePlayer('+nextPlayerID+')">Delete</button></div>';
box.setAttribute("style","background-color: #333;border-radius: 5px;border: 1px solid #333;");
boxWrapper.appendChild(box);
                             // If there is no player, we have to set the currentEditPlayerID as the newly created playerID (nextPlayerID)
                             // Otherwise it will try to load the currentEditPlayerID (which might be a non existing player) in the LoadPlayerConfiguration
                             // When clicking the Edit button.
    if (! AtLeastOnePlayer){
    AtLeastOnePlayer = true;
    currentEditPlayerID = nextPlayerID;
    UpdatePlayerConfigurationEdit("false");
    LoadPlayerConfiguration(nextPlayerID);
}
                             // Increment nextPlayerID.
nextPlayerID++;
                             // Increment number player
NumberOfPlayer++;
UpdateNumberPlayerDisplay();
}

function DeletePlayer(PlayerID){
/*
This function removes a player from the simulation input.
It will ask for a prompt from the user to make sure the action was deliberate.
*/
    const confirmation = confirm("Are you sure you want to delete the player : " + String(PlayerConfigDict[PlayerID]["PlayerName"]) + "? Make sure that there are no actions targetting this player if you delete it.");
    if (! confirmation){return;}
                             // Updating player counter
    NumberOfPlayer--;
    UpdateNumberPlayerDisplay();
                             // Removing the player from the PlayerConfigDict and from the roster viewer
    document.getElementById("Edit"+String(PlayerID)).remove()
    delete PlayerConfigDict[PlayerID];
                             // If the deleted player was not the one being edited. We do nothing.
    if (PlayerID != currentEditPlayerID){return;}
                             // If the deleted player was the one being edited, we update so the user is editing the first player
    for (let id in PlayerConfigDict){
                             // If there is at least one player, we now select the first player in the list.
        currentEditPlayerID = id;
        LoadPlayerConfiguration(id, save=false);
        return;
    }
                             // If we're here there were no other players. So we will clear the screen.
    AtLeastOnePlayer = false;
    UpdatePlayerConfigurationEdit("true");
    document.getElementById("ActionListPick").innerHTML = "";
    document.getElementById("PlayerActionListViewer").innerHTML = "";
}

function DelActionFromList(ActionID){
/*
This function returns a function that will delete an action from the PlayerActionlistViewer.
The returned action is called when the user clicks on the action. It takes an ActionID which
corresponds to the ActionIden of the action.
*/
    function delAction(){
    /*
    Deletes an action from the player's action list.
    If is wait_ability or any targetted action it will ask the user
    if they wish to change the wait_timer or the target. If not it will delete
    the action.
    */  
        var doc = document.getElementById(ActionID);
        var ActionList = PlayerConfigDict[currentEditPlayerID]["ActionList"];
        var action;

                             //Find the Action with the ActionIden
        for (let i = 0;i<ActionList.length;i++){
            if (ActionList[i]["ActionID"] == ActionID)
                {
                action = ActionList[i];
                break;
                }
        }

        if (action["target"] != -1)
            {
                             // We will ask the user if they want to simply change the target.
                var UserInput = prompt("This action has a player target. If you wish to change the target enter a valid playerID. Otherwise "+
                                       "simply click on 'Ok' or 'Cancel' with no input to delete the action.");
                
                if (UserInput != null && UserInput != ""){
                             // User wants change the target
                    if (validateTarget(UserInput)){
                        alert("The input player ID is unvalid. The operation is cancelled.");
                        return;
                    }
                    action["target"] = UserInput;
                             // Will also change the title value.
                    doc.removeAttribute("title");
                    doc.setAttribute("title", ActionViewerDocTitle(action, true));
                    return;
                }
            }
        else if (action["Action"] == "wait_ability")
            {
                             // We will ask the user if they want to simply change the target.
                var UserInput = prompt("If you want to change the wait time enter a valid input. Otherwise simply click on 'Ok' or 'Cancel' with no input to delete the action.");
                
                if (UserInput != null && UserInput != ""){
                             // User wants to change the wait time
                    if (validateWaitTime(UserInput)){
                        alert("The wait time is unvalid. The operation is cancelled.");
                        return;
                    }
                    action["WaitTime"] = UserInput;
                             // Will also change the title value.
                    doc.removeAttribute("title");
                    doc.setAttribute("title", ActionViewerDocTitle(action, false));
                    return;
                }
            }

                                // Adjust the IndexInList of the other actions.
        for(let i = action["IndexInList"]+1;i<ActionList.length;i++){
            ActionList[i]["IndexInList"]--;
        }
                                // Removes the division from the viewer
        document.getElementById(ActionID).remove();
                                // Remove the action from the player's actionlist
        PlayerConfigDict[currentEditPlayerID]["ActionList"].splice(action["IndexInList"],1);
        PlayerConfigDict[currentEditPlayerID]["NextActionIndex"]--;
    }

return delAction;

}

function CreateAddAction(ActionID, IsTargetted, IsAdded, ActionIden){
/*
This function returns a function that adds an action to a player's action list. Every button in the ActionlistPicker is generated one such function.
*/

    function AddActionToPlayer(){
    /*
    This function adds an action to a player list
    */
                             // This value will uniquely represent the action in the ActionList.
                             // If IsAdded is true, then it will be created, if it is false the value in ActionIden will 
                             // be used.
    var Identification = "";
                             // If the action is added (and not repopulated), we create an entirely new 
                             // entry for it in the actionlist of the player.
    if (IsAdded) {

                             // First check if player has reached action limit
        if (PlayerConfigDict[currentEditPlayerID]["ActionList"].length>=120){alert("Action limit reached. Cannot add more than 120 actions per player.");return;}
                                // Giving new ActionIdentification since action we are adding
        Identification = String(currentEditPlayerID)+String(PlayerConfigDict[currentEditPlayerID]["NextActionID"]);
        //PlayerConfigDict[currentEditPlayerID]["NextActionID"]++;
                                // Action is the action's name
                                // ActionID is a unique value for the action in the actionlist of the player (it is a concatenation of the player's ID and the NextactionID value of the player)
                                // Index in list corresponds to the index of the action in the action list of the player.
                                // target is the target ID if there is any. -1 represents the enemy.
        ActionDict = {
        "Action" : ActionID,
        "ActionID" : Identification, 
        "IndexInList" : PlayerConfigDict[currentEditPlayerID]["NextActionIndex"],
        "target" :  -1
        };
                                // If the action is waitability, we ask for a duration for it.
        if (ActionID == "wait_ability"){
            ActionDict["WaitTime"] = prompt("Input how long (in seconds) you want the player to wait for :");

                             // Will validate the input
            if (validateWaitTime(ActionDict["WaitTime"])) 
                {
                alert("Invalid input for wait_ability. The action will not be added.");
                return;
                }
        }                    // If there is a player target, we ask for it
        if (IsTargetted){
            var TargetID = prompt("Enter the PlayerID of who you want to target with this ability");
            
                             // We will validate the input
            if (validateTarget(TargetID))
            {
            alert("Invalid target input. The action will not be added.");
            return;
            }      
            ActionDict["target"] = TargetID;
        }
        
        PlayerConfigDict[currentEditPlayerID]["ActionList"].push(ActionDict);
    }
    else {
                             // Repopulating the ActionListViewer. So the Identification is simply the one given
        Identification = ActionIden;
                             // Finding the action dictionnary
        for (let i = 0;i<PlayerConfigDict[currentEditPlayerID]["ActionList"].length;i++){
            if (PlayerConfigDict[currentEditPlayerID]["ActionList"][i]["ActionID"] == Identification){
                ActionDict = PlayerConfigDict[currentEditPlayerID]["ActionList"][i];
            }
        }
    }
        // Get the ActionListViewer to add the div.
        const ActionListViewer = document.getElementById("PlayerActionListViewer");
        PlayerJob = PlayerConfigDict[currentEditPlayerID]["Job"];
                                    // Adding the new division in the ActionListViewer
        const newAction = document.createElement('div');
        newAction.setAttribute("title", ActionViewerDocTitle(ActionDict, IsTargetted));
        newAction.innerHTML = '<img src="/static/simulate/PVEIcons/'+PlayerJob+'/'+ActionID+'.png" width="40px" height="40px" class="Icon">';
        newAction.onclick = DelActionFromList(Identification);
        newAction.setAttribute("id", Identification);
        ActionListViewer.appendChild(newAction);
                                // Incrementing the ID and index
    PlayerConfigDict[currentEditPlayerID]["NextActionIndex"]++;
    PlayerConfigDict[currentEditPlayerID]["NextActionID"]++;

    }
return AddActionToPlayer;
}

/*
UPDATE FUNCTIONS
*/
function UpdatePlayerConfigurationEdit(NewValue){
/*
This function updates the inputs in the player configuration division.
NewValue = true means we are disabling, and NewValue = false means we are enabling them.
*/
                                // Warning the player that they must add 1 player at least if NewValue is true.
if (NewValue == "true"){                           
    document.getElementById("PlayerIDField").innerHTML = "You must add at least one player to edit those fields.";
    document.getElementById("PlayerIDField").style = "color:red;";
                                // If there are no players, we lock the edit of the
                                // Player Configuration division and inform the user
                                // that they must add 1 player to be able to edit.
                                // Disable the inputs
    document.getElementById("MainStat").setAttribute("readonly", "true");
    document.getElementById("Crit").setAttribute("readonly", "true");
    document.getElementById("DH").setAttribute("readonly", "true");
    document.getElementById("WD").setAttribute("readonly", "true");
    document.getElementById("SkS").setAttribute("readonly", "true");
    document.getElementById("SpS").setAttribute("readonly", "true");
    document.getElementById("Ten").setAttribute("readonly", "true");
    document.getElementById("etroURL").setAttribute("readonly", "true");
    document.getElementById("PlayerName").setAttribute("readonly", "true");
    }
else if(NewValue == "false"){
    document.getElementById("PlayerIDField").style = "";
    document.getElementById("MainStat").removeAttribute("readonly");
    document.getElementById("Crit").removeAttribute("readonly");
    document.getElementById("DH").removeAttribute("readonly");
    document.getElementById("WD").removeAttribute("readonly");
    document.getElementById("SkS").removeAttribute("readonly");
    document.getElementById("SpS").removeAttribute("readonly");
    document.getElementById("Ten").removeAttribute("readonly");
    document.getElementById("etroURL").removeAttribute("readonly");
    document.getElementById("PlayerName").removeAttribute("readonly");
}
}
function UpdateRequirement(){RequirementOn=document.getElementById("RequirementOnCheckBox").checked;}
function UpdateManaCheck(){IgnoreMana=!IgnoreMana;}
function UpdateDebugMode(){DebugMode=!DebugMode;}
function UpdateTeamCompBonus(){TeamCompBonus=!TeamCompBonus;}
function UpdateMaxPotencyPlentifulHarvest(){MaxPotencyPlentifulHarvest=!MaxPotencyPlentifulHarvest;}
function UpdateResultNewTab(){
    ResultNewTab=!ResultNewTab;
    if (ResultNewTab)
        document.getElementById("NewTabAlert").innerHTML= "The simulation's result will open in a new tab so make sure your browser is not blocking it";
    else
    document.getElementById("NewTabAlert").innerHTML= "Careful! You will loose the Simulation's input when simulating if you do not open in a new tab!"; // Wiping
}
function UpdateName(){
    /*
    This function is called when a Player's name is updated in order to also update the name in the Roster Viewer.
    */
    document.getElementById('Player'+currentEditPlayerID+'Name').innerHTML = document.getElementById("PlayerName").value + " ID - " + currentEditPlayerID;
    }
function UpdateNumberPlayerDisplay(){
    document.getElementById("player_counter").innerHTML = String(NumberOfPlayer);
}
/*
HTTP REQUEST RELATED FUNCTIONS
*/
function Submit(){
    /* 
    This function is called when Submitting a SimulationInput. It will make sure it is valid 
    and will put the information in a suitable way for the library to use it.
    */

    if (InQueue){
        var UserInput = confirm("Your simulation is in queue. Are you sure you want to leave the queue?");
        if (UserInput){
            InQueue = false;
            document.getElementById("ProcessingDiv").setAttribute("hidden", "true");
            document.getElementById("ButtonText").innerHTML = "Simulate"
            return;
        }
        else{return;}
    }

                                 // We check if there is at least one player. If not we exit and alert the user.
    if (! AtLeastOnePlayer){alert("The simulation needs at least one player.");return;}
    var FightDuration = document.getElementById("FightDuration").value;
    if (FightDuration <= 0 || FightDuration > 150){alert("The fight's duration must be between 0 and 150 secconds.");return;}

                                 // We save the currently edited player's input.
    SavePlayerConfiguration(currentEditPlayerID);
    
                                 // This dict represents the fight's parameter's value selected by the user.
    var FightInfo = {
        "RequirementOn": RequirementOn,
        "IgnoreMana": IgnoreMana,
        "fightDuration" : document.getElementById("FightDuration").value
    }
    
                                 // This dict will hold a list of all players.
    var PlayerList = []
                                 // We will go through every player currently inputted and add them to PlayerList
    for (let key in PlayerConfigDict){
        PlayerDict = PlayerConfigDict[key];
                                 // Validating the values of the stats
        for (let i in PlayerDict["Stat"]){
            if(!onlyNumbers(PlayerDict["Stat"][i])){
                alert("Invalid stat "+ i +" for player"+ PlayerDict["PlayerName"]);
                return;
            }
        }
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
                                     // We make sure that every player has at least one action. If not, we return and alert the user.
        if (actionList.length == 0){alert("Every player must have at least one action. Currently the player " + PlayerDict["PlayerName"] + " has no actions.");return;}
    
                                     // PlayerConfig is a dictionnary that parses the data in a way that the library can use.
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
                                 // dataDict is what will be sent in the POST request.
    var dataDict = {
        "data" : {
            "fightInfo" : FightInfo,
            "PlayerList" : PlayerList
        },
        "mode" : DebugMode,
        "TeamCompBonus" : TeamCompBonus,
        "MaxPotencyPlentifulHarvest" : MaxPotencyPlentifulHarvest
    };
                                 // POST request Logic
    xhr = new XMLHttpRequest();
    var url = "/simulate/SimulationInput/";
    xhr.open("POST", url, true);
    xhr.setRequestHeader("Content-type", "application/json");
    xhr.onreadystatechange = function() {
                                 // When the request has been processed, the user is sent to the SimulationResult page. If there was an error the user is notified and we return.
    if (xhr.readyState == XMLHttpRequest.DONE && xhr.status == 200 && InQueue) {
        if (ResultNewTab) {
            window.open('/simulate/SimulationResult/', '_blank').focus();
            InQueue = false;
            document.getElementById("ProcessingDiv").setAttribute("hidden", "true");
            document.getElementById("ButtonText").innerHTML = "Simulate"
            return;
        }
        else window.location.href = '/simulate/SimulationResult/';
    }
    }
                                 // Sends the request.
    var data = JSON.stringify(dataDict);
    InQueue = true;
    document.getElementById("ButtonText").innerHTML = "Leave Queue"
    xhr.send(data);
    document.getElementById("ProcessingDiv").removeAttribute("hidden"); 
    //window.location.href = '/simulate/WaitingQueue/';
    }

/*
HELPER FUNCTIONS
*/

function ActionViewerDocTitle(Action, IsTargetted){
    return Action["Action"] + (IsTargetted ? " targetID : " + Action["target"] : "") + (Action["Action"] == "wait_ability" ? " time : " + Action["WaitTime"] : "")
}

function onlyFloat(str) {
	return /^\d*[.]\d*$/.test(str);
}

function onlyNumbers(str) {
	return /^\d*$/.test(str);
}

function getFormatActionName(str){
    var nameParsedArray = []
    var currSubString = ""
    for (var i = 0; i < str.length; i++) {
        if (str.charAt(i) == str.charAt(i).toUpperCase() && (str.length - i ) > 3 && str.charAt(i) != "_"){
                             // We will check if the next work is "The" in which case we will just add a space.
            var x = str.substring(i,i+2);
            nameParsedArray.push(currSubString);
            currSubString = str.charAt(i);
        } else{
            currSubString+=str.charAt(i);
        }
      }
    nameParsedArray.push(currSubString);
    var innerHTML = '<div class="topOfEachOther"><p>'
    for (var i = 0; i < nameParsedArray.length; i++){
        word = nameParsedArray[i];
        innerHTML += " " + word;
    }
    innerHTML += "</p></div>";
    return innerHTML;
}

function ValidPlayerID(id){
    for (let i = 0; i< PlayerConfigDict["PlayerList"].length;i++){
        if (PlayerConfigDict["PlayerList"][i]["PlayerID"] == String(id)){return true;}
    }
    return false;
}

/*
USER INPUT FUNCTIONS
*/

/*
LOADING DATA INTO VIEWER FUNCTIONS OR SAVING DATA
*/
function LoadPlayerActionsPick(ChangingJob){
/*
This function Load a player's action's on the ActionPick viewer
*/
                                // Wiping the action pick viewer from previous player.
document.getElementById("ActionListPick").innerHTML = "";

PlayerConfigDict[currentEditPlayerID]["Job"] = document.getElementById("Job").value;
var PlayerJob = PlayerConfigDict[currentEditPlayerID]["Job"];
                                // If the loading is from the action of changing the player's job, we also wipe the 
                                // actionlist of the player and the actionlist viewer.
if (ChangingJob){
    PlayerConfigDict[currentEditPlayerID]['ActionList'] = [];
    PlayerConfigDict[currentEditPlayerID]['NextActionIndex'] = 0;
    PlayerConfigDict[currentEditPlayerID]['NextActionID'] = 0;
    document.getElementById("PlayerActionListViewer").innerHTML = "";
}

var IconNameList = IconDict[PlayerJob];
const box = document.getElementById("ActionListPick");

                                // Will now Populate the ActionPicker
for (var i = 0;i<IconNameList.length;i++){
    const newBox = document.createElement("div");
    newBox.setAttribute("class", "ActionPicker");
    newBox.innerHTML = '<img src="/static/simulate/PVEIcons/'+PlayerJob+'/'+IconNameList[i]+'.png" title="'+IconNameList[i]+'" width="60px" height="60px" class="Icon" role="button">'+getFormatActionName(IconNameList[i]);
    newBox.onclick = CreateAddAction(IconNameList[i] /*ActionID*/, TargetActionList.includes(IconNameList[i]) /*IsTargetted*/, true /*IsAdded*/, -1 /*ActionIden*/);
    box.appendChild(newBox);
    }
    }
function LoadPlayerConfiguration(PlayerID, save=true){
/*
This function loads a player's data in the Player Configuration and ActionListViewer division.
*/
                                // If we want to save the currentEditPlayer's configuration, save=true (by default)
if (save){SavePlayerConfiguration(currentEditPlayerID);}

                                // This puts a white border around the player we want to edit.
const box = document.getElementById('Player'+currentEditPlayerID+'Name');
box.innerHTML = PlayerConfigDict[currentEditPlayerID]["PlayerName"] + " ID - "+currentEditPlayerID;
document.getElementById("Edit"+PlayerID).setAttribute("style","background-color: #333;border-radius: 5px;border: 3px solid white;");
                                // If a new player was created and there was no previous players, then currentEditPlayerID == PlayerID. So we skip this part.
if (PlayerID != currentEditPlayerID){document.getElementById("Edit"+currentEditPlayerID).setAttribute("style","background-color: #333;border-radius: 5px;border: 1px solid #333;");}
                                // Changing the currentEditPlayerID value.
currentEditPlayerID = PlayerID;
                                // We put back all the saved value of the player we want to edit.
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
                                // We wipe the ActionList and ActionlistViewer and the NextActionID. 
                                // These will be refilled in LoadPlayerActionsPick and LoadPlayerActionList
document.getElementById("ActionListPick").innerHTML = "";
document.getElementById("PlayerActionListViewer").innerHTML = "";
PlayerConfigDict[currentEditPlayerID]["NextActionID"] = 0;
PlayerConfigDict[currentEditPlayerID]["NextActionIndex"] = 0;

LoadPlayerActionsPick(false /* ChangingJob */);
LoadPlayerActionList();
    }
function LoadPlayerActionList(){
/*
This function loads all a player's action in the ActionListViewer.
*/
var ActionList = PlayerConfigDict[currentEditPlayerID]["ActionList"];

for (let i = 0;i<ActionList.length;i++){
    var Action = ActionList[i]
    CreateAddAction(Action["Action"] /*ActionID*/, Action["target"]!= -1 /*IsTargetted*/, false /*IsAdded*/, Action["ActionID"]/*ActionIdentification*/)();
}
}
function SavePlayerConfiguration(PlayerID){
/*
This function saves a player configuration to the PlayerConfigDict
*/
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

/*
CODE TO EXECUTE WHEN OPENING SimulationInput
*/
window.onload = function (){UpdatePlayerConfigurationEdit("true");}
/*
END
*/