
var name,
    connectedUser;

// connecting to the signaling server
// change the url to where the sever is hosted
var connection = new WebSocket('ws://localhost:8888');

connection.onopen = function () {
  console.log("Connected");
  // get a code for the user after connecting to the server
  send({ type: "login" });
};

// Handle all messages through this callback
connection.onmessage = function (message) {
  console.log("Got message", message.data);

  var data = JSON.parse(message.data);

  switch(data.type) {
    case "login":
      onLogin(data);
      break;
    case "offer":
      onOffer(data.offer, data.name);
      break;
    case "answer":
      onAnswer(data.answer);
      break;
    case "candidate":
      onCandidate(data.candidate);
      break;
    case "leave":
      onLeave();
      break;
    default:
      break;
  }
};

connection.onerror = function (err) {
  console.log("Got error", err);
};

// Alias for sending messages in JSON format
function send(message) {
  if (connectedUser) {
    message.name = connectedUser;
  }

  connection.send(JSON.stringify(message));
};

function onLogin(data) {
    name = data.code;
    $("#yourCode").text(name); // show the code to the user
    startConnection();
};

var yourConnection, connectedUser, dataChannel, currentFile, currentFileSize, currentFileMeta;

function startConnection() {
  if (hasRTCPeerConnection()) {
    setupPeerConnection();
  } else {
    alert("Sorry, your browser does not support WebRTC.");
  }
}

function setupPeerConnection() {
  var configuration = {
    "iceServers": [{ "url": "stun:stun.l.google.com:19302" }]
  };
  yourConnection = new RTCPeerConnection(configuration, {optional: []});

  // Setup ice handling
  yourConnection.onicecandidate = function (event) {
    if (event.candidate) {
      send({
        type: "candidate",
        candidate: event.candidate
      });
    }
  };

  openDataChannel();
}

function openDataChannel() {
  var dataChannelOptions = {
    ordered: true,
    reliable: true,
    negotiated: true,
    id: "myChannel"
  };
  dataChannel = yourConnection.createDataChannel("myLabel", dataChannelOptions);

  dataChannel.onerror = function (error) {
    console.log("Data Channel Error:", error);
  };

  dataChannel.onmessage = function (event) {
    try {
      var message = JSON.parse(event.data);
      switch (message.type) {
        case "start":
          currentFile = [];
          currentFileSize = 0;
          currentFileMeta = message.data;
          console.log(message.data)
          console.log("Receiving file", currentFileMeta);
          break;
        case "end":
          saveFile(currentFileMeta, currentFile);
          break;
      }
    } catch (e) {
      // Assume this is file content
      currentFile.push(atob(event.data));

      currentFileSize += currentFile[currentFile.length - 1].length;

      var percentage = Math.floor((currentFileSize / currentFileMeta.size) * 100);
    }
  };

  dataChannel.onopen = function () {
    $("#btn-disconnect").removeAttr("disabled");

    $("#btn-connect").attr("disabled", "disabled")
                      .removeClass("btn-default")
                      .addClass("btn-success")
                      .text("Connected to " + connectedUser);

    $("#otherDeviceCode").val("")
                         .attr("disabled","disabled");
    $("#files-box").removeClass("hidden");
  };

  dataChannel.onclose = function () {
    $("#btn-disconnect").attr("disabled","disabled");

    $("#btn-connect").removeAttr("disabled")
                     .addClass("btn-default")
                     .removeClass("btn-success")
                     .text("Connect");

    $("#otherDeviceCode").val("")
                         .removeAttr("disabled");
                         
    $("#files-box").addClass("hidden");

  };
}

// Alias for sending messages in JSON format
function dataChannelSend(message) {
  dataChannel.send(JSON.stringify(message));
}

function saveFile(meta, data) {
  var blob = base64ToBlob(data, meta.type);
  saveAs(blob, meta.name);
}

function hasUserMedia() {
  navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
  return !!navigator.getUserMedia;
}

function hasRTCPeerConnection() {
  window.RTCPeerConnection = window.RTCPeerConnection || window.webkitRTCPeerConnection || window.mozRTCPeerConnection;
  window.RTCSessionDescription = window.RTCSessionDescription || window.webkitRTCSessionDescription || window.mozRTCSessionDescription;
  window.RTCIceCandidate = window.RTCIceCandidate || window.webkitRTCIceCandidate || window.mozRTCIceCandidate;
  return !!window.RTCPeerConnection;
}

function hasFileApi() {
  return window.File && window.FileReader && window.FileList && window.Blob;
}

function startPeerConnection(user) {
  connectedUser = user;

  // Begin the offer
  yourConnection.createOffer(function (offer) {
    send({
      type: "offer",
      offer: offer
    });
    yourConnection.setLocalDescription(offer);
  }, function (error) {
    alert("An error has occurred.");
  });
};

function closePeerConnection() {
  send({ type: "leave" });
  onLeave();
}

function onOffer(offer, name) {
  connectedUser = name;
  yourConnection.setRemoteDescription(new RTCSessionDescription(offer));

  yourConnection.createAnswer(function (answer) {
    yourConnection.setLocalDescription(answer);

    send({
      type: "answer",
      answer: answer
    });
  }, function (error) {
    alert("An error has occurred");
  });
};

function onAnswer(answer) {
  yourConnection.setRemoteDescription(new RTCSessionDescription(answer));
};

function onCandidate(candidate) {
  yourConnection.addIceCandidate(new RTCIceCandidate(candidate));
};

function onLeave() {
  connectedUser = null;
  yourConnection.close();
  yourConnection.onicecandidate = null;
  setupPeerConnection();
};

function arrayBufferToBase64(buffer) {
    var binary = '';
    var bytes = new Uint8Array( buffer );
    var len = bytes.byteLength;
    for (var i = 0; i < len; i++) {
        binary += String.fromCharCode( bytes[ i ] );
    }
    return btoa(binary);
}

function base64ToBlob(b64Data, contentType) {
    contentType = contentType || '';

    var byteArrays = [], byteNumbers, slice;

    for (var i = 0; i < b64Data.length; i++) {
      slice = b64Data[i];

      byteNumbers = new Array(slice.length);
      for (var n = 0; n < slice.length; n++) {
          byteNumbers[n] = slice.charCodeAt(n);
      }

      var byteArray = new Uint8Array(byteNumbers);

      byteArrays.push(byteArray);
    }

    var blob = new Blob(byteArrays, {type: contentType});
    return blob;
}

var CHUNK_MAX = 160000; // choosing a larger size makes the process faster but it depends on the network
function sendFile(file, fileId) {
  var reader = new FileReader();

  reader.onloadend = function(evt) {
    if (evt.target.readyState == FileReader.DONE) {
      var buffer = reader.result,
          start = 0,
          end = 0,
          last = false;

      function sendChunk() {
        end = start + CHUNK_MAX;

        if (end > file.size) {
          end = file.size;
          last = true;
        }

        var percentage = Math.floor((end / file.size) * 100);
        $("#file-" + fileId + " .progress-bar").attr("aria-valuenow", percentage)
                                               .css("width", percentage + "%");

        dataChannel.send(arrayBufferToBase64(buffer.slice(start, end)));

        // If this is the last chunk send our end message, otherwise keep sending
        if (last === true) {
          dataChannelSend({
            type: "end"
          });
          startSending(); // send the next file if available
          $(".btn-remove-file-" + fileId).removeClass("btn-warning")
                                        .addClass("btn-success")
                                        .attr("onclick", "")
                                        .attr("disabled", "disabled")
                                        .text("success");
        } else {
          start = end;
          // Throttle the sending to avoid flooding
          setTimeout(function () {
            sendChunk();
          }, 100); // this slows the file transfer significantly
        }
      }

      sendChunk();
    }
  };

  // this loads the whole file into memory
  // not good for large files
  reader.readAsArrayBuffer(file);
}