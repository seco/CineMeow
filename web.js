var express = require("express");
var app = express();
app.use(express.logger());
app.use(express.bodyParser());
app.set('title', 'CineMeow');
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');

var mongourl = 'mongodb://admin:meowmeow@paulo.mongohq.com:10029/app19434598';
var db = require('mongodb').Db.connect(mongourl, function(error, dbConnection) { db=dbConnection; });

app.get('/', function(request, response) {
	response.render('index');
});

app.post('/newproject', function(req, res) {
	db.collection("projects", function(err, collection) {
		collection.insert( {
			name: req.body["name"],
			created_at: (new Date()).toString(),
			clips: []
		}, function(err, inserted) {
			if (err) {
				console.log(err);
				res.send(400);
			} else {
				res.send(200);
			}
		});
	});
});

app.post('/newclip', function(req, res) {
	var ObjectID = require('mongodb').ObjectID;
	var id = new ObjectID(req.body["id"]);
	db.collection("projects", function(err, collection) {
		collection.findOne({ "_id": id }, function(err, results) {
			if (err || !results) {
				console.log(err);
				res.send(400);
			} else {
				var clipStats = {
					"name": req.body["name"],
					"start_time": req.body["start_time"],
					"end_time": req.body["end_time"],
					"source": req.body["source"]
				}
				results.clips.push(clipStats);
				collection.update({"_id": id}, {$set: {"clips": results.clips}}, function (err) {
					if (err) {
						res.send(400);
					}
				});
				res.send(200);
			}
		});
	});
});

var port = process.env.PORT || 5000;
app.listen(port, function() {
	console.log("Listening on " + port);
});

//Test public 
//app.use(express.static(__dirname + '/public'));
app.configure(function(){
  app.use('/assets', express.static(__dirname + '/public/assets'));
  app.use(express.static(__dirname + '/public'));
});

