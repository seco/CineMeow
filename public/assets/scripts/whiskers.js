//Adds video at correct location, and generates an ID for it?
function addClipToData(clip){
	//Insert clip in chronological index\
	for(var i = 0; i < clips_data.length; i ++){
		if(clips_data[i].timeline_start_time > clip.timeline_start_time){
			clips_data.splice(i, 0, clip);
			inserted = true;
			return;
		}
	}
	clips_data.push(clip);
}

//If clip is updated, its time might change, so remove it and reinsert it into the array 
function updateClip(clip){
	removeClipFromData(clip);
	addClipToData(clip);
}

function convertDataToJSON(){
	clips_data_JSON = "{project_id:" + current_project_id +", clips: [";
	for(var i = 0; i < clips_data.length; i ++){
		clips_data_JSON += "{ ";
		clips_data_JSON += "'clip_id' : " +             clips_data[i].clip_id;
		clips_data_JSON += "'source_video_id' : " +     clips_data[i].source_video_id;
		clips_data_JSON += "'clip_start_time' : " +     clips_data[i].clip_start_time;
        clips_data_JSON += "'timeline_start_time' : " + clips_data[i].timeline_start_time;
		clips_data_JSON += "'clip_length' : " + 	    clips_data[i].clip_length;
		clips_data_JSON += "'filters' : " +	            clips_data[i].filters;
		clips_data_JSON += " }";
	}
	clips_data_JSON += "]}";
}

function convertJSONtoData(json){
	var parsed = JSON.parse(infoJSON);
	current_project_id = parsed.project_id;
	clips_data = parsed.clips;
}

// intial loading
var starttime = 10;
var endtime = 15;
var starttime2 = 20;
var endtime2 = 24;

function getClipsJSON (){
	return clips_data_JSON;
}

function getClipsObjectArray (){
	return clips_data; //Warning: big security risk here, probably should clone; but the caveat is that deep cloning is a lot slower...
}

//Gonna needs:
//Undo
function undo(){
	//Send request to server for undo
	var returnedJSON = "";
	clips_data_JSON = returnedJSON;
	convertJSONtoData(returnedJSON);
}
//Redo
function redo(){
	//Send request to server for redo
	var returnedJSON = "";
	clips_data_JSON = returnedJSON;
	convertJSONtoData(returnedJSON);
}

//Modify Clip
function clipWasModified(clip){
	updateClip(clip);
}
//Request Play 
function requestPlay(){
    var source = $("#videoplayer video:first-child").attr("id");
    playClips(source, 0);
}

var interval = 0;

function playClips(source, clip_order){
    console.log("===STARTING PLAYCLIPS===");
    console.log(project.clips);
    var dirty = 0;
    var swap = 0;
    var i = clip_order;
    var swap_i;
    var nextsource;
    $("#" + source)[0].play();
    var starttime, endtime, clip_length;
    console.log("source: " + source + " i: " + i + " len: " + project.clips.length);

    var callback = function() {
        console.log("i: " + i);
        if(i == project.clips.length) {
            $("#" + source)[0].pause();
            window.clearInterval(interval);
            console.log("STOPPED");
            return false;
        }

        if(i+1 < project.clips.length) {
            nextsource = project.clips[i+1]["source"];
            nextsource = nextsource.slice(0, -4);
            console.log("i+1: " + nextsource);
            console.log("swap var: " + swap);

            if(nextsource != source && swap == 0) {
                console.log("nextsource is diff: " + nextsource);
                swap_i = i+1;
                console.log("swap_i: " + swap_i);
                swap = 1;
            }
        }

        starttime = parseInt($("#start" + i).val());
        clip_length = parseInt($("#length" + i).val());
        endtime = starttime + clip_length;

        // sets start of specified clip to play
        if($("#" + source)[0].currentTime != starttime && dirty == 0) {
            $("#" + source)[0].currentTime = starttime;
            dirty = 1;
        }

        // move to the next clip
        if($("#" + source)[0].currentTime > endtime && dirty == 1) {
            console.log("I made it!");
            dirty = 0;
            i++;

            if(swap == 1 && i == swap_i) {
                console.log("swapping to: " + nextsource);
                $("#" + source)[0].pause();
                swap = 0;
                source = nextsource;
                $("#" + source)[0].play();
                return false;
            }
        }
    };

    var interval = window.setInterval(callback, 1000);
}

function requestPause() {
    var source = $("#videoplayer video:first-child")[0].pause();
    interval++;
    window.clearInterval(interval);
    console.log("KILLED");
}

/* Note: this is assuming:
* - project.clips[i] exists
* - the clip is not already in the timeline
* TODO: make it so you also have to specify where the clip shows up in the timeline (for drag n drop)
*/
var rtime = new Date(1, 1, 2000, 12,00,00);
var timeout = false;
var delta = 200;
function addClipToTimeline(i,color){
    console.log(project.clips.length);
    var scalingFactor = 10;
    var timelineid = "#drag-x";
    var clip=project.clips[i];
    var color="#"+Math.floor(((1/(1+clip["clip_id"]))*7216)+15770000).toString(16); // lol
    $(timelineid).append('<div id="drag'+i+'" class="drag clip" style="background-color:'+color+'">'+clip.name+'</div>');
    $("#drag"+i).offset({left: clip["timeline_start_time"]*scalingFactor + $(timelineid).offset().left} );
    $("#drag"+i).width((clip["clip_length"])*scalingFactor);
    console.log("width " + (clip["clip_length"])*scalingFactor);
    console.log("offset " + (clip["timeline_start_time"]));
       //Set initial values
    var position = $("#drag"+i).offset();
    var offset = $(timelineid).offset().left;
    var start = (position.left - offset) / scalingFactor -.6; 
    var width = $("#drag"+i).width() / scalingFactor;
    $("#start" + i).val(start);
    $("#length" + i).val(width);
    $("#drag"+i).draggable({
                    containment: timelineid,
                    stack: ".drag",
                    axis: "x",
                    grid: [1,1],  
                    snap: true,
                    snapTolerance: 5, 
                    stop: function() {
                        console.log("saving clips!");
                        saveClips(true, "drag");
                    },
                    drag: function(e){
                        var position = $(this).offset();
                        var offset = $(timelineid).offset().left;
                        var start = (position.left - offset) / scalingFactor -.6; 
                        var width = $(this).width() / scalingFactor;
                        //e.stopPropagation();
                        //$(this).text("");
                        $("#info").text("start:" + start + " end: " + (start+width) + " length: "+ width);
                        var idnum2 = $(this).attr('id');//.substring(5);//"drag"
                        var idnum = idnum2.substring(4);//"drag"
                        $("#start" + idnum).val(start);
                        $("#length" + idnum).val(width);
                    }
    });
    /* make draggable div always on top */
    $("#drag"+i).mousedown(function () {
            $("div[id^='drag']").each(function () {
                    var seq = $(this).attr("id").replace("drag", "");
                    $(this).css('z-index', seq);
            });
    });
    $("#drag"+i).resizable({
        handles: 'e, w', 
        minWidth: 10, //maxwidth will be determined by video clip!
        minHeight: 70,
        containment: timelineid
    }); 
    $("#drag"+i).resizable( "option", "maxWidth", 39*scalingFactor/*project.clips[i].*/ );
    $("#drag"+i).resize(function(e){
        var position = $(this).offset();
        var offset = $(timelineid).offset().left;
        var start = (position.left - offset) / scalingFactor - .6; 
        var width = $(this).width() / scalingFactor;
        //e.stopPropagation();
        //$(this).text("");
        $("#info").text("start:" + start + " end: " + (start+width) + " length: "+ width);
        var idnum2 = $(this).attr('id');//.substring(5);//"drag"
        var idnum = idnum2.substring(4);//"drag"
        $("#start" + idnum).val(start);
        $("#length" + idnum).val(width);

        rtime = new Date();
        if (timeout === false) {
            timeout = true;
            setTimeout(resizeend, delta);
        }
    } );
    $("#drag"+i).mouseover(function () {
        //$(this).css('opacity', '1');
    });
    $("#drag"+i).mouseout(function () {
        $(this).css('opacity', '.7');
    });

}
function resizeend() {
    var rtime = new Date(1, 1, 2000, 12,00,00);
    var timeout = false;
    var delta = 200;
    if (new Date() - rtime < delta) {
        setTimeout(resizeend, delta);
    } else {
        timeout = false;
        saveClips(true, "resize");
    }               
}
$(function () {

    /* basic */
    var timelineid = "#drag-x";


    $.ajax({
    	type: "GET",
    	url: "http://cinemeow.herokuapp.com/project?id=528a6b61e8f3c650ef000001",
	    success: function(data) {
            project = data;
            project.clips_stack = [];
            $('#title').text(project.name);
            $('#created_at').text("Created on "+project.created_at);  
            populateTimelineWithCurrentClips();
            updateUndoRedoButtons();
            updateStack(project["clips"]);
        },
        error: function(XMLHTTPRequest, textStatus, error) {
            console.log(XMLHTTPRequest+" "+error);
        }
        });
    });
function populateTimelineWithCurrentClips(){

    var children = $("#drag-x").children();
    while(children.length > 0){
        console.log("removing!!!!");
        children[0].remove();
        children.splice(0,1);
    }
     console.log("worked!!!!");
    for (var i in project.clips) {
        console.log("POPULATING: " + i)
        var clip=project.clips[i];
        var color="#"+Math.floor((Math.random()*7216)+15770000).toString(16); // lol
        //$(timelineid).append('<div id="drag'+i+'" class="drag clip" style="background-color:'+color+'">'+clip.name+'</div>');
        addClipToTimeline(i, color);
        i++;
        $("#log").append('Clip ' + i);
        i--;
        $("#log").append('<input type="text" id="start'+i+'" value="'+clip["timeline_start_time"]+'">');
        $("#log").append('<input type="text" id="length'+i+'" value="'+clip["clip_length"]+'"><br/>');
    }
}

function saveClips(update_stack, message) {
    $("#change_message").text("Saving changes...");
    var projectJSON;
    for(var i = 0; i < project.clips.length; i++) {
        project["clips"][i]["timeline_start_time"] = $("#start" + i).val();
        project["clips"][i]["clip_length"] = $("#length" + i).val();
    }
    //Add to UndoStack
    if(update_stack){
        updateStack(project["clips"]);
    }
    projectJSON = JSON.stringify(project);
    console.log("Saving: (" + message + ")");
    console.log(projectJSON);
    $.ajax({
        type: "POST",
        url: "http://cinemeow.herokuapp.com/editproject",
        data: "id="+project._id+"&data="+projectJSON,
        success: function(data) {
            console.log("successfully updated "+data);
            $("#change_message").text("Changes saved automatically");
        },
        error: function(XMLHttpRequest, textStatus, errorThrown) {
            console.log(errorThrown);
            $("#change_message").css("color: #FF0000;");
            $("#change_message").text("Warning: Error saving changes");
        }
    });
}

//Video Clips Menu

$(function(){
    /*for (var i in project.clips) {
        var clip=project.clips[i];
        var color="#"+Math.floor((Math.random()*7216)+15770000).toString(16); // lol
        $("#drag-clipsviewer").append('<div id="dragclip'+i+'" class="drag clip" style="background-color:'+color+'">'+clip.name+'</div>');
    }
    for (var i in project.clips) {
        $("#dragclip"+i).offset({left: project.clips[i]["start_time"]*scalingFactor + $("#drag-clipsviewer").offset().left} );
        $("#dragclip"+i).width((project.clips[i]["end_time"]-project.clips[i]["start_time"])*scalingFactor);
        console.log("width " + (project.clips[i]["end_time"]-project.clips[i]["start_time"])*scalingFactor);
    }*/
    var container_count = 2;
    /*
    //HARDCODED:
      $("#drag-clipsviewer").append('<table id="clipsource'+0+'"  class= "clip_source" style=" width: 530px, background-color: black"> </table>');
      $("#drag-clipsviewer").append('<table id="clipsource'+1+'"  class= "clip_source" style=" width: 530px, background-color: black"> </table>');
      $("#clipsource" +0).append('<tr> <td> <div id="dragclone'+0+'"  class="drag_clone" > drag </div> </td>'
                                       +'<td> <div id="clipcontainer'+0+'" class="clip_container" style="background-color: E0F0FF"> </div> </td>'
                                 +'</tr>');
      $("#clipsource" +1).append('<tr> <td> <div id="dragclone'+1+'"  class="drag_clone" > drag </div> </td>'
                                       +' <td> <div id="clipcontainer'+1+'" class="clip_container" style="background-color: E0F0FF"> </div> </td>'
                                  +' </tr>');
      var color="#"+Math.floor((Math.random()*7216)+15770000).toString(16); // lol
      $("#clipcontainer" +0).append('<div id="dragclip'+0+'" class="dragclip drag" style="background-color:'+color+'"> some clip </div>');
      var color="#"+Math.floor((Math.random()*7216)+15770000).toString(16); // lol
      $("#clipcontainer" +1).append('<div id="dragclip'+1+'" class="dragclip drag" style="background-color:'+color+'"> some other clip </div>');
      */
    retrieveVideos();

    /* X axis only */
    /*for(var i = 0; i < container_count; i ++){
        $("#dragclip"+i).draggable({
                containment: "#clipcontainer" + i,
                stack: ".dragclip",
                axis: "x",
                grid: [1,1],  
                snap: true,
                snapTolerance: 5, 
                stop: function() {
                    //console.log("saving clips!");
                    //saveClips();
                }
                //,
                //drag: function(e){
                //}
        });
        $("#dragclip"+i).resizable({
            handles: 'e, w', 
            minWidth: 10, //maxwidth will be determined by video clip!
            minHeight: 70,
            maxWidth: 500,
            //containment: "#clipcontainer" + i,
            //TODO GET CONTAINMENT WORKING DYNAMICALLY
            //containment: "#drag-clipsviewer"//containment: "#clipcontainer"+i
        });
    }*/

     $( ".drag_clone" ).draggable({
        helper: function(event) {
            var clone = $(event.target).clone();
            clone.removeClass(".drag_clone");
            clone.addClass(".drag");
            clone.css({ "background-color": "orange", //TODO: color of clip in viewer 
                        "width": "75px",
                        "height": "75px",
                        "minWidth": "75px",
                        "minHeight": "75px",
                        "border-radius":"8px",
                        "opacity": ".7",
                        "border":"none" });
            return clone;
        },
        revert: "invalid",
    });

    $( "#drag-x").droppable({
            accept: ".drag_clone",
            activeClass: "ui-state-hover",
            hoverClass: "ui-state-active",
            drop: function( event, ui ) {
                console.log("DROPEED");
                //TODO: make it the color of the clip being dragged in 
                var color="#"+Math.floor((Math.random()*7216)+15770000).toString(16); // lol
                $("#drag-x").append('<div id="drag'+10+'" class="drag clip" style="background-color:'+color+'"> ADDED </div>');
            }

    }); 
});

function retrieveVideos() {
    $.ajax({
        type: "GET",
        url: "/cliplist",
        success: function(data) {
            clipList = JSON.parse(data);
            cliprow=0;
            $("#drag-clipsviewer").empty();
            $("#drag-clipsviewer").append('<table id="cliprepo">');
            for (i in clipList) {
                if (i % 5 == 0) {
                    $("#cliprepo").append('<tr id="cliprow'+cliprow+'" class="clip_source" style="width: 530px">');
                } 
                $("#cliprow" + cliprow).append('<td><div id="dragclone'+i+'" class="drag_clone">drag</div></td>' +'<td><div id="clipcontainer'+i+'" class="clip_container" style="background-color: #E0F0FF">'+clipList[i]+'</div></td>'); 
                if (i % 5 == 4) {
                    $("#drag-clipsviewer").append('</tr>');
                    cliprow++;
                }
                $( "#dragclone" +i).draggable({
                    helper: function(event) {
                        var clone = $(event.target).clone();
                        clone.removeClass(".drag_clone");
                        clone.addClass(".drag");
                        clone.css({ "background-color": "orange", //TODO: color of clip in viewer 
                                    "width": "75px",
                                    "height": "75px",
                                    "minWidth": "75px",
                                    "minHeight": "75px",
                                    "border-radius":"8px",
                                    "opacity": ".7",
                                    "border":"none" });
                        return clone;
                    },
                    revert: "invalid",
                });
            }
            $("#drag-clipsviewer").append('</table>');
        }
    });
}

function updateUndoRedoButtons(){
    //REDO
    if(clips_redo_stack.length > 0){
        console.log("ENABLING R")
        $("#redo").prop("disabled",false);
    }else{
        $("#redo").prop("disabled",true);
    }
    //UNDO
    if(clips_stack.length > 1){
           console.log("ENABLING U " + clips_stack.length)
        $("#undo").prop("disabled",false);
    }else{
        $("#undo").prop("disabled",true);
    }
}

function uploadVideo() {
    $("#fileupload").trigger('click');
    $("#fileupload").change(function() {
        var file = document.getElementById('fileupload').files[0];

        AWS.config.update({accessKeyId: 'AKIAIGUBB7DTOBPXCNHA', secretAccessKey: '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'});
        var bucket = new AWS.S3({params: {Bucket: 'media.cinemeow'}});

        var params = {Key: file.name, ContentType: file.type, Body:file};
        bucket.putObject(params, function(err, data) {
            $("#change_message").text(err ? 'Error uploading video': 'Video uploaded successfully');
            retrieveVideos();
        });
    });
}

function removeNewProjectDialogue() {
    $("#newProjWindow").remove();
    $(".blackout").remove();
}

function newProject() {
    $.ajax({
        type: "POST",
        url: "/newproject",
        data: "name="+$("#newProjectName").val()+"&password="+$("#newProjectPassword").val(),
        success: function(data) {
            window.location = "/project?id="+data;
        }
    });
}

function newProjectDialogue() {
    $("body").append("<div class='blackout'></div>");
    $("body").append("<div id='newProjWindow'><h1>Create New Project</h1></div>");
    $("#newProjWindow").append("<input type='text' id='newProjectName' placeholder='Project Name' style='width: 300px; font-size: 20px; text-align: center;'/><br /><br />");
    $("#newProjWindow").append("<input type='password' id='newProjectPassword' placeholder='Project Password' style='width: 300px; font-size: 20px; text-align: center;'/><br />");
    $("#newProjWindow").append("<br /><button type='button' onclick='removeNewProjectDialogue();'>Cancel</button><button type='button' onclick='newProject();'>Submit</button>");
}

