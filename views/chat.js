//make connection

let socket = io.connect('http://localhost:3000');

//query the DOM

const message = document.getElementById('message'),
      handle = document.getElementById('handle'),
      btn = document.getElementById('send'),
      output = document.getElementById('output'),
      feedback = document.getElementById('feedback');



//Emit event, emit tar två parametrar, firsta namnet på message, andra vad datan är som skickas
//till servern, ett object.
//tar alltså här valuet av inputfälten och skickar till servern
//1
btn.addEventListener('click', function(){
    socket.emit('chat', {
        message: message.value,
        handle: handle.value
    })
    message.value = '';
});
//här tar gör vi att när man skriver ett meddelande så aktiveras keypress och vi 
//skickar den infon till backend

message.addEventListener("keypress", (KeyboardEvent) => {
    if(KeyboardEvent.keyCode === 13) {
        console.log("Enter was pressed!");
        btn.click()
    }
});

//listen for events
//3
socket.on('chat', function(data){
    feedback.innerHTML = '';
    output.innerHTML += '<p><strong>' + data.handle + ':</strong>' + data.message + '</p>';
});
//här tar vi tillbaka infon från backend och skickar ut i feedback diven
socket.on('typing', function(data){
    feedback.innerHTML = '<p><em>' + data + '' + ' is typing a message...</em></p>';
});

socket.on('allMessages', function(messages) {
    messages.forEach(function(message) {
      output.innerHTML += '<p><strong>' + message.handle + ':</strong> ' + message.message + '</p>';
    });
  });