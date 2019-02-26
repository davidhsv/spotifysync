/**
 * Copyright 2016 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
'use strict';

var interval;
var currentlyPlaying;

// Initializes the Demo.
function Demo() {
  document.addEventListener('DOMContentLoaded', function() {
    // Shortcuts to DOM Elements.
    this.signInButton = document.getElementById('demo-sign-in-button');
    this.signOutButton = document.getElementById('demo-sign-out-button');
    this.emailContainer = document.getElementById('demo-email-container');
    this.nameContainer = document.getElementById('demo-name-container');
    this.deleteButton = document.getElementById('demo-delete-button');
    this.uidContainer = document.getElementById('demo-uid-container');
    this.profilePic = document.getElementById('demo-profile-pic');
    this.signedOutCard = document.getElementById('demo-signed-out-card');
    this.signedInCard = document.getElementById('demo-signed-in-card');

    // Bind events.
    this.signInButton.addEventListener('click', this.signIn.bind(this));
    this.signOutButton.addEventListener('click', this.signOut.bind(this));
    this.deleteButton.addEventListener('click', this.deleteAccount.bind(this));
    firebase.auth().onAuthStateChanged(this.onAuthStateChanged.bind(this));

    interval = setInterval(this.checkMusicPlaying.bind(this), 3000);
  }.bind(this));
}

Demo.prototype.checkMusicPlaying = async function() {

  var api = new SpotifyWebApi();
  //admin.auth().token console.log(admin.auth()) procurar token spotify:davidhsvgo
  console.log('aquiiiii');
  
  console.log(firebase.auth());

  var snap = await firebase.database().ref('/spotifyAccessToken/' + firebase.auth().currentUser.uid).once('value');
  var access_token = snap.val();

  api.setAccessToken(access_token);
  api.getMyCurrentPlayingTrack(async function(err, data) {
    if (err) console.error(err);
    else console.log(data);

    if (data && data.is_playing) {
      currentlyPlaying = {
        "position_ms" : data.progress_ms,
        "uris" : [data.item.uri]
      };
    }

    snap = await firebase.database().ref('/musica-sala').once('value');
    var musicaSala = snap.val();

    var minhaMusicaNovinha = currentlyPlaying && currentlyPlaying.position_ms < 5000;

    if (minhaMusicaNovinha) {
      firebase.database().ref('/musica-sala').set({position_ms: currentlyPlaying.position_ms, uri: currentlyPlaying.uris[0]});
    } else if (!currentlyPlaying || (musicaSala.uri && musicaSala.uri !== currentlyPlaying.uris[0])) { // || Math.abs(musicaSala.position_ms - currentlyPlaying.position_ms) > 3000
      api.play({
        "position_ms" : musicaSala.position_ms,
          "uris" : [musicaSala.uri]
        }, function(err, data) {
        if (err) console.error(err);
        else console.log(data);
      });
    }

  });

}

// Triggered on Firebase auth state change.
Demo.prototype.onAuthStateChanged = function(user) {
  if (user) {
    this.nameContainer.innerText = user.displayName;
    this.emailContainer.innerText = user.email;
    this.uidContainer.innerText = user.uid;
    this.profilePic.src = user.photoURL;
    this.signedOutCard.style.display = 'none';
    this.signedInCard.style.display = 'block';
    //this.checkMusicPlaying();
  } else {
    this.signedOutCard.style.display = 'block';
    this.signedInCard.style.display = 'none';

    //clearInterval(interval);
  }
};

// Initiates the sign-in flow using Spotify sign in in a popup.
Demo.prototype.signIn = function() {
  // Open the popup that will start the auth flow.
  window.open('popup.html', 'name', 'height=585,width=400');
};

// Signs-out of Firebase.
Demo.prototype.signOut = function() {
  firebase.auth().signOut();
};

// Deletes the user's account.
Demo.prototype.deleteAccount = function() {
  firebase.auth().currentUser.delete().then(function() {
    window.alert('Account deleted');
  }).catch(function(error) {
    if (error.code === 'auth/requires-recent-login') {
      window.alert('You need to have recently signed-in to delete your account. Please sign-in and try again.');
      firebase.auth().signOut();
    }
  });
};

// Load the demo.
new Demo();
