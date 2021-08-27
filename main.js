const openStream = () => {
  const config = { audio: true, video: true };
  return navigator.mediaDevices.getUserMedia(config);
};

const playStream = (idVideoTag, stream) => {
  const video = document.getElementById(idVideoTag);
  video.srcObject = stream;
  video.play();
};

const peer = new Peer();
let clientCall = undefined;
let partnerPeerId = undefined;

peer.on("open", (id) => {
  $("#local-peer").append(id);
});

$("#call-remote").on("click", () => {
  const id = $("#remote-peer").val();
  openStream().then((stream) => {
    playStream("local-stream", stream);
    const call = peer.call(id, stream);
    call.on("stream", (remoteSteam) => {
      playStream("remote-stream", remoteSteam);
      $("#hang-up").prop("disabled", false);
      clientCall = call;
      partnerPeerId = call.peer;
    });
    call.on("close", () => {
      $("#remote-peer").val("");
      playStream("remote-stream", undefined);
      playStream("local-stream", undefined);
      $("#hang-up").prop("disabled", true);
    });
  });
});

$("#hang-up").on("click", () => {
  if (clientCall && partnerPeerId) {
    for (let conns in peer.connections) {
      peer.connections[conns].forEach((conn, index, array) => {
        if (conn.peer === partnerPeerId) {
          console.log(
            `closing ${conn.connectionId} peerConnection (${index + 1}/${
              array.length
            })`,
            conn.peerConnection
          );
          conn.peerConnection.close();

          if (conn.close) {
            conn.close();
          }
        }
      });
    }
  }
});

peer.on("call", (call) => {
  openStream().then((stream) => {
    call.answer(stream);
    playStream("local-stream", stream);
    call.on("stream", (remoteStream) => {
      playStream("remote-stream", remoteStream);
      $("#remote-peer").val(call.peer);
      $("#hang-up").prop("disabled", false);
      clientCall = call;
      partnerPeerId = call.peer;
    });
    call.on("close", () => {
      $("#remote-peer").val("");
      playStream("remote-stream", undefined);
      playStream("local-stream", undefined);
      $("#hang-up").prop("disabled", true);
    });
  });
});
