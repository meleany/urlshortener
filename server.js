// URL Shortener Microservice by Yasmin Melean 19/04/2017
// Using Node.js, MongoDB, Express and Pug.
var urlExists = require("url-exists");
var shortid = require("shortid");
var mongo = require("mongodb");
var express = require("express");
var app = express();
var PORT = process.env.PORT || 3000;

// Initializing variables for main page and mongodb.
var mongoUrl = process.env.MONGODB_URI;
var example = {url: "https://www.google.com", short: "3xAmP13"};
var hostname, original, url, short, shorturl;
var collection;

// Starting MongoDB connection to database, this is the only dependency driver. 
mongo.mongoClient;
mongo.connect(mongoUrl, function(err, db){
  if(err) throw err;
  collection = db.collection("shorturls");
  collection.find({url: example.url}, {short:1}).toArray(function(err, document){
    if(document.length < 1){
      collection.insert(example); 
    }
  });
});

// npm install pug in order to use Pug, Express loads the module internally using:
app.set("view engine", "pug");
app.set("views", __dirname + "/static");

// Set up of main page. Database can be use here, but not really necessary as example is known.
app.get("/", function(request, response){
  hostname = request.protocol + "://" + request.hostname;
  original = example.url;
  url = hostname + "/" + original;
  shorturl = hostname + "/" + example.short;
  response.render("index.pug", {"url": url, "original": original, "short": shorturl});
  console.log("Request sent from: ", hostname);
});

// Gets the parameter passed as a string from the URL. Module url-exists checks if urls are valid. 
// Module valid-url was not dectecting fake urls.
app.get("/*", function(request, response){
  hostname = request.protocol + "://" + request.hostname;
  original = request.params[0];
  urlExists(original, function(err, exists){
    if(exists){
      collection.find({url: original}, {short: 1}).toArray(function(err, document){
        if(document.length >0){
          shorturl = document[0].short; 
        }else{
          shorturl = shortid.generate();
          collection.insert({url: original, short: shorturl});
        }
        shorturl = hostname + "/" + shorturl;
        response.send({"original_url": original, "short_url": shorturl});
      });
    }else{
      collection.find({short: original}, {url: 1}).toArray(function(err,document){
        if(document.length > 0){
          response.redirect(document[0].url);
        }else{
          response.send({"ERROR": "Not a valid URL (make sure is also a valid format)."});
        }
      });
    }    
  });
});

// Starts a server and listens in PORT connection
// The default routing is 0.0.0.0 represented by :: in IPv6
var server = app.listen(PORT, function(){
  var host = server.address().address;
  if(host == "::"){ host = "0.0.0.0"; }
  var port = server.address().port;
  console.log("URL Shortener Microservice running at http://%s:%s", host, port);
});