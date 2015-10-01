
// imports
var Mopidy = require("mopidy");
var spark = require("spark");
var credentials = require("./credentials.json");

var mopidy_ip = credentials.mopidy_ip;
var spark_access_token = credentials.spark_access_token;

// Login to particle cloud
spark.login({accessToken: spark_access_token}, function () {
  console.log("[ OK ] connected to particle cloud");
});

var currentTracks, m;
// create modipy instance
var mopidy = new Mopidy({
    webSocketUrl: "ws://"+mopidy_ip+":6680/mopidy/ws/"
});
mopidy.on("state:online", function () {
    m = mopidy;
  console.log("[ OK ] connected to mopidy server on "+mopidy_ip);
});



spark.onEvent('album selected', function(response) {
    getAlbumAndPlay(response.data);
});

spark.onEvent('album removed', function() {
  mopidy.on("state:online", function() {
    mopidy.tracklist.remove({any : currentTracks});
  });
});

function getAlbumAndPlay (albumTitle){

  albumTitle = albumTitle || "Stadtaffe";
  console.log("Album '"+ albumTitle +"' selected");

  m.library.search({"album":albumTitle}).then(function (results) {

      var localResults, spotifyResults, uri;

      // select local search
      if (results[0].uri == "local:search"){
        localResults = results[0];
        spotifyResults = results[1];
      } else {
        localResults = results[1];
        spotifyResults = results[0];
      }

      if (localResults.albums != undefined){
        uri = localResults.albums[0].uri;
      } else {
        uri = spotifyResults.albums[0].uri;
      }

      m.library.lookup(uri).then(function(response){
        m.tracklist.add(response, 0).then(function (tlTracks) {
          currentTracks = tlTracks;
          m.playback.play(tlTracks[0]);
        });
      });
    });
}
