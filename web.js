var express = require("express");
var app = express();
app.use(express.logger());
app.set('title', 'CineMeow');
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
<<<<<<< HEAD
=======

var mongourl = process.env.MONGOHQ_URL;
var db = require('mongodb').Db.connect(mongourl, function(error, dbConnection) { db=dbConnection; });
>>>>>>> c3f469a8c9236caf73f0d158e22ba16502860e09

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

var port = process.env.PORT || 5000;
app.listen(port, function() {
	console.log("Listening on " + port);
});
