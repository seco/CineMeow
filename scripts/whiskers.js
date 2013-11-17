//Front-end code
var clips_data_JSON;
var clips_data = [];
var current_project_id = "someID number";

//Clip Data Structure
var clip_ex = new Object();
clip_ex.start_time = 15; //in ms
clip_ex.end_time = 120;  //in ms
clip_ex.source_video_id = "someID";
clip_ex.clip_id = "someIDAs well";
ciip_ex.filters = " ";//{};// array of filter info, will get into later

//Adds video at correct location, and generates an ID for it?
function addClipToData(clip){
	//Insert clip in chronological index\
	for(var i = 0; i < clips_data.length; i ++){
		if(clips_data[i].start_time > clip.start_time){
			clips_data.splice(i, 0, clip);
			inserted = true;
			return;
		}
	}
	clips_data.push(clip);
}

//Remove clip from data
function removeClipFromData(clip){
	var clip_id = clip.clip_id;
	for(var i = 0; i < clips_data.length; i ++){
		if(clips_data[i].clip_id == clip_id){
			clips_data.splice(i,1);
		}
		return;
	}
	console.log("clip not found in data array");
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
		clips_data_JSON += "'clip_id' : " +         clips_data[i].clip_id;
		clips_data_JSON += "'source_video_id' : " + clips_data[i].source_video_id;
		clips_data_JSON += "'start_time' : " +      clips_data[i].start_time;
		clips_data_JSON += "'end_time' : " + 	    clips_data[i].end_time;
		clips_data_JSON += "'filters' : " +	        clips_data[i].filters;
		clips_data_JSON += " }";
	}
	clips_data_JSON += "]}";
}

// intial loading

function loadStart(event) {
	// framework for how to start/end a clip @ a certain time
	var starttime = 10;
	var endtime = 15;

	$("video").on('timeupdate', function() {
		if(this.currentTime < starttime) {
			this.currentTime = starttime;
		}
		if(this.currentTime > endtime) {
			this.pause();
		}
	});
}

function init() {
	$("video").on('loadedmetadata', loadStart);
}

$(document).ready(function() {
	init();
});
