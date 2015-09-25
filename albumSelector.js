
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

// create modipy instance
var mopidy = new Mopidy({
    webSocketUrl: "ws://"+mopidy_ip+":6680/mopidy/ws/",
    callingConvention : "by-position-or-by-name"
});
mopidy.on("state:online", function () {
  console.log("[ OK ] connected to mopidy server on "+mopidy_ip);
});


var currentTracks;

spark.onEvent('album selected', function(album) {
  mopidy.on("state:online", function() {
    getAlbumAndPlay(album);
  });
});

spark.onEvent('album removed', function() {
  mopidy.on("state:online", function() {
    mopidy.tracklist.remove({any : currentTracks});
  });
});

function getAlbumAndPlay (albumTitle){

  albumTitle = albumTitle || "Stadtaffe";

  mopidy.library.search({"album":albumTitle}).then(function (results) {
      // uri of first album in results
      var uri = results[0].albums[0].uri;

      mopidy.library.lookup(uri).then(function(response){
        mopidy.tracklist.add(response, 0).then(function (tlTracks) {
          currentTracks = tlTracks;
          mopidy.playback.play(tlTracks[0]);
        });
      });
    });
}
