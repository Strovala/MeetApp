var
    port        = process.env.PORT || 3000,
    bodyParser  = require('body-parser'),
    express     = require('express'),
    mongodb     = require('mongodb');
    app         = express(),
    pg          = require('pg'),
    pug         = require('pug'),
    connectionString = 'postgres://postgres:root@localhost:5432/hackathon',
    client = new pg.Client(connectionString);
    FB = require('fb');



const request = require('request');

var urlBasic = 'https://app.ticketmaster.com/discovery/v2/events.json?';
var apikey = 'apikey=gT3H1E94OfQSKqUTxcMVl0SGGqjYnUg8';

var server = app.listen(port);
app.set('view engine', 'pug');
app.use(express.static('public'))
console.log('\t :: Express :: Listening on port ' + port );

app.get('/', function (req, res) {
  res.render('template');
});

app.get('/search', function (req, res) {
  var name = req.query.name;
  url = urlBasic + 'keyword=' + name + '&' + apikey;
  var returnEvents = function(ev) {
    res.json(ev)
  }
  request(
    url,
    { json: true },
    function (err, res, body) {
      if (err) { return console.log(err); }
      console.log(body.url);
      console.log(body.explanation);
      if (body._embedded) {
        var events = body._embedded.events;
        var list = [];
        for (var i in events) {
          list.push({
            id: events[i].id,
            name: events[i].name,
            picture: events[i].images[2].url,
            dates: events[i].dates,
            venue: events[i]._embedded.venues[0].name
          })
        }
      } else {
        var list = [];
      }
      returnEvents(list);
    }
  );
  console.log("Got a GET request for the homepage");
});

app.get('/sendRequest', function (req, res) {
  var results = [];
  var senderID = req.query.sender
  var reciverID = req.query.receiver
  var eventID = req.query.eventId
    pg.connect(connectionString, (err, client, done) => {
      // Handle connection errors
      if(err) {
        done();
        console.log(err);
        return res.status(500).json({success: false, data: err});
      }
      // SQL Query > Insert Data
      client.query('INSERT INTO requests VALUES($1, $2, $3, $4)',[reciverID, eventID, senderID, 0], function (err, res) {
        if (err) console.log(err);
      });
      // SQL Query > Select Data
      const query = client.query('SELECT * FROM requests');
      // Stream results back one row at a time
      query.on('row', (row) => {
        results.push(row);
      });
      // After all data is returned, close connection and return results
      query.on('end', () => {
        done();
        return res.json(results);
      });
    });
})


app.get('/approveRequest', function (req, res) {
  var results = [];
  var senderID = req.query.sender
  var reciverID = req.query.receiver
  var eventID = req.query.eventId
    pg.connect(connectionString, (err, client, done) => {
      // Handle connection errors
      if(err) {
        done();
        console.log(err);
        return res.status(500).json({success: false, data: err});
      }
      // SQL Query > Insert Data
      client.query('UPDATE requests SET accepted = 1 WHERE receiver = $1 AND eventId = $2 AND sender = $3',[reciverID, eventID, senderID], function (err, res) {
        if (err) console.log(err);
      });
      // SQL Query > Select Data
      const query = client.query('SELECT * FROM requests ');
      // Stream results back one row at a time
      query.on('row', (row) => {
        results.push(row);
      });
      // After all data is returned, close connection and return results
      query.on('end', () => {
        done();
        return res.json(results);
      });
    });
})


app.get('/view', function (req, res) {
  var userId = req.query.userId;
  var eventId = req.query.eventId;
  pg.connect(connectionString, (err, client, done) => {
     // Handle connection errors
     if(err) {
       done();
       console.log(err);
       return res.status(500).json({success: false, data: err});
     }
     // SQL Query > Select Data
     const query = client.query('SELECT * FROM UsersEvents WHERE userId=$1 AND eventId=$2', [userId, eventId]);
     // Stream results back one row at a time
     results = [];
     query.on('row', (row) => {
       results.push(row);
     });
     // After all data is returned, close connection and return results
     query.on('end', () => {
       done();
       var response = {
         show: false
       };
       if (results.length == 0) {
         response.show = true;
       }
       return res.json(response);
     });
   });
})

app.get('/requests', function (req, res) {
  var userId = req.query.userId;
  pg.connect(connectionString, (err, client, done) => {
     // Handle connection errors
     if(err) {
       done();
       console.log(err);
       return res.status(500).json({success: false, data: err});
     }
     // SQL Query > Select Data
     const query = client.query('SELECT * FROM Requests WHERE receiver=$1', [userId]);
     // Stream results back one row at a time
     results = [];
     query.on('row', (row) => {
       results.push(row);
     });
     // After all data is returned, close connection and return results
     query.on('end', () => {
       done();
       return res.json(results);
     });
   });


})

app.get('/add', function(req, res) {
  var userId = req.query.userId;
  var eventId = req.query.eventId;

  pg.connect(connectionString, (err, client, done) => {
     // Handle connection errors
     if(err) {
       done();
       console.log(err);
       return res.status(500).json({success: false, data: err});
     }
     // SQL Query > Insert Data
     client.query('INSERT INTO UsersEvents(userId, eventId) values($1, $2)', [userId, eventId], function (err, res) {

     });
     // SQL Query > Select Data
     const query = client.query('SELECT * FROM UsersEvents');
     // Stream results back one row at a time
     results = [];
     query.on('row', (row) => {
       results.push(row);
     });
     // After all data is returned, close connection and return results
     query.on('end', () => {
       done();
       return res.json(results);
     });
   });
});

app.get('/logged', function (req, res) {
  var username = req.params.username;
  if (username == 'Strovala')
    var userId = "766846723485002";
  else {
    var userId = "100003195796291";
  }
  var accessToken = "EAACGTV19R14BABfjtGDkR2b2AHenrpbb6Typ7NZCeRZAY0KRQuJVez86LZBMzCYFLrAobnfFvAZBQ0JwlxaraZCcrXjMuGnMeLPgZCByLpwLjX94kVDZB49CGUJbSIiPTTS8i092swisXr6KTH4XQwFtOYGMJYBAc6KZBWKS8W78QrUP6GCDxm5POU42XHs9JIVmmCwCfvO0aQZDZD";
  pg.connect(connectionString, (err, client, done) => {
     // Handle connection errors
     if(err) {
       done();
       console.log(err);
       return res.status(500).json({success: false, data: err});
     }
     // SQL Query > Insert Data
     client.query('INSERT INTO Users(userId, accessToken) values($1, $2)', [userId, accessToken], function (err, res) {

     });
     // SQL Query > Select Data
     const query = client.query('SELECT * FROM Users');
     // Stream results back one row at a time
     results = [];
     query.on('row', (row) => {
       results.push(row);
     });
     // After all data is returned, close connection and return results
     query.on('end', () => {
       done();
       return res.json({
         userId: userId
       });
     });
   });
});

//
// app.get('/test', function (req, res) {
//   console.log(req.query.authResponse.userID);
//   FB.setAccessToken(req.query.authResponse.accessToken);
//
//   FB.api('4', function (res) {
//     if(!res || res.error) {
//      console.log(!res ? 'error occurred' : res.error);
//      return;
//     }
//     console.log(res.id);
//     console.log(res.name);
//   });
//
//   res.send({
//     id: 'krimi'
//   });
// });



// search?q=Zdravko%20Colic&type=event
