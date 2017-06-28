var socket;
var last_state;
var last_outputs;
function page_init(){
    webSocketConnect();
    
    document.getElementById('current').onclick = function (e) {
        if (last_state.data.state ==3 )
            socket.send('MPD_API_SET_PAUSE');
        else 
            socket.send('MPD_API_SET_PLAY');
    }
    
}
function list_playlist(data){

    var radio_list=document.getElementById('radio_list');
    while (radio_list.firstChild) {
            radio_list.removeChild(radio_list.firstChild);
        }
    for(var i=0; i<data.length;i++)
    {
        var radio_list_entry = document.getElementById('radio_list_entry_proto').cloneNode(true);
        radio_list_entry.removeAttribute("id");
        radio_list_entry.innerHTML=data[i].title;
        radio_list_entry.setAttribute('index', data[i].id);
        radio_list_entry.setAttribute('pos', data[i].pos);
        
        radio_list_entry.className="radio_list_entry shown unselected";
        
        radio_list_entry.onclick = function (e) {
            socket.send('MPD_API_PLAY_TRACK,'+this.getAttribute('index'));
            };
        
        radio_list.appendChild(radio_list_entry);
    }
    return
}
function highlight_current(pos){
    var list=document.getElementsByClassName('radio_list_entry');
    for(var i=0; i<list.length;i++)
    {
        if (list[i].getAttribute('pos') == pos)
        {
            list[i].className=list[i].className.replace('unselected','current');
        }
        else {
            list[i].className=list[i].className.replace('current','unselected');
        }
    }
    
}
function webSocketConnect() {
    if (typeof MozWebSocket != "undefined") {
        socket = new MozWebSocket("ws://0.0.0.0:8080/ws");
    } else {
        socket = new WebSocket("ws://0.0.0.0:8080/ws");
    }

    try {
        socket.onopen = function() {
            console.log("connected");
            document.getElementById("waitIcon").style.display="none";
            document.getElementById("syncIcon").style.display="block";
            
            /* emit initial request for output names */
            socket.send("MPD_API_GET_OUTPUTS");
            socket.send("MPD_API_GET_QUEUE,0");
        }

        socket.onmessage = function got_packet(msg) {
            if(msg.data === last_state || msg.data.length == 0)
                return;

            var obj = JSON.parse(msg.data);

            switch (obj.type) {
                case "queue":
                    list_playlist(obj.data);
                    break;
                case "search":
                    break;
                case "browse":
                    break;
                case "state":
                    //highlight_current(obj.data.songpos);
                    if(JSON.stringify(obj) === JSON.stringify(last_state))
                        break;
                    highlight_current(obj.data.songpos);
                    if (obj.data.state == 3)
                    {
                        document.getElementById("pauseIcon").style.display="none";
                        document.getElementById("soundIcon").style.display="block";
                    }
                    else {
                        document.getElementById("soundIcon").style.display="none";
                        document.getElementById("pauseIcon").style.display="block";
                    }
                    last_state = obj;
                    break;
                case "outputnames":
                    break;
                case "outputs":
                    if(JSON.stringify(obj) === JSON.stringify(last_outputs))
                        break;
                    last_outputs = obj;
                    break;
                case "disconnected":
                    document.getElementById("syncIcon").style.display="none";
                    document.getElementById("waitIcon").style.display="block";
                    break;
                case "update_queue":
                    socket.send('MPD_API_GET_QUEUE,0');
                    break;
                case "song_change":
                    if(obj.data.title)
                        document.getElementById("current").innerHTML=obj.data.title;
                    //~ document.getElementById("current").innerHTML=obj.data.artist;
                    //~ document.getElementById("current").innerHTML=obj.data.album;
                    break;
                case "mpdhost":
                    break;
                case "error":
                    console.log("error: "+obj.data);
                    break;
            }
        }
        socket.onclose = function(){
            console.log("disconnected");
            document.getElementById("status_left").innerHTML="no";
            webSocketConnect();
        }

    } catch(exception) {
        alert('<p>Error' + exception);
    }

}
