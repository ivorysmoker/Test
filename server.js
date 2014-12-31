//Module Express
var express = require('express'),
    app = express(),
    server = require('http').createServer(app),
    io = require('socket.io').listen(server),
    OnlineUsers = {};
	BenutzerIp = [];
	BenutzerIpName = [];
	BenutzerReihenFolge = [];
	KartenMap = ["#Feld30", "#Feld29", "#Feld28", "#Feld27", "#Feld26", "#Feld25", "#Feld24", "#Feld23", "#Feld22", "#Feld21", "#Feld20", "#Feld19", "#Feld18", "#Feld17", "#Feld16", "#Feld15", "#Feld14", "#Feld13", "#Feld12", "#Feld11", "#Feld0", "#Feld1", "#Feld2", "#Feld3", "#Feld4", "#Feld5", "#Feld6", "#Feld7", "#Feld8", "#Feld9", "#Feld10", "#Feld31", "#Feld32", "#Feld33", "#Feld34", "#Feld35", "#Feld36", "#Feld37", "#Feld38", "#Feld39" ];
	KostenMap = [0, 60, 0, 60, 200, 200, 100, 0, 100, 120, 0, 140, 150, 140, 160, 200, 180, 0, 180, 200, 0, 220, 0, 220, 240, 200, 260, 260, 150, 280, 0, 300, 300, 0, 320, 200, 0, 350, 200, 400];
	NamenMap = ["Los", "Kiosk", "Gemeinschaftsfeld", "Reinigung", "Einkommensteuer", "Süd-Bahnhof", "Tabakladen", "Ereignisfeld", "Getränkemarkt", "Restaurant", "Knast", "Müll Deponie" , "Elektrizitätswerk" , "Tankstelle" , "Waschanlage", "West-Bahnhof", "Lidli", "Gemeinschaftsfeld", "Aldli", "Metrio", "Frei parken", "Theater", "Ereignisfeld", "Oper", "Museum", "Nord-Bahnhof", "Tennisplatz", "Spielehalle", "Wasserwerk" , "Fussballfeld", "Gehe ins Gefängnis", "Rathhausplatz", "Steueramt", "Gemeinschaftsfeld", "Zollamt" ,"Hauptbahnhof", "Ereignisfeld", "Gerichtsgebäude", "Monopoly Steuer", "Juwelier"];
	TestArr = [[]];
	GekaufeArtikel = {};
server.listen(1339);
console.log("Server Online");
var mysql = require('mysql');
var fs = require('fs');
var path = require('path');
// wenn der Pfad / aufgerufen wird
app.get('/spielfeldbeta.jpg' ,function(req, res){
	// statische Dateien ausliefern
    res.sendFile(path.join(__dirname, '/', 'spielfeldbeta.jpg'));
});
app.get('/Monopoly' ,function(req, res){
	// statische Dateien ausliefern
    res.sendFile(path.join(__dirname, '/', 'index.html'));
});

app.get('/' ,function(req, res){
	// statische Dateien ausliefern
    res.sendFile(path.join(__dirname, '/', 'login.html'));
	
});
	
io.sockets.on('connection', function (socket) {
var clientIp = socket.request.connection.remoteAddress;
var Vorhanden = BenutzerIp.indexOf(clientIp);
if(Vorhanden >= 0){
var pos = BenutzerIp.indexOf(clientIp);
console.log("Ein Benutzer ist wiedergekehrt und hat die POS"+ pos);
socket.nickname = BenutzerIpName[pos];
socket.PlayerActive = 0;
socket.PlayerPosition = 0;
socket.PlayerCash = 1500;
OnlineUsers[socket.nickname] = socket;
updateNicknamesOnline();
}
	socket.on('Login', function(data, callback){ 
       if(data in OnlineUsers){
	   console.log("Benutzer Existiert schon!");
           //io.sockets.emit('ServerMessege', socket.nickname+': <span class="online">ist wieder online</span>'+'</br>');
       }else{
	    console.log("Benutzer angelegt!");
		socket.nickname = data;
		socket.PlayerActive = 0;
		socket.PlayerPosition = 0;
		socket.PlayerCash = 1000;
		OnlineUsers[socket.nickname] = socket;
			BenutzerIp.push(clientIp);
			BenutzerIpName.push(socket.nickname);
			socket.emit("Weiterleitung");
			//socket.nickname = data;
           //io.sockets.emit('ServerMessege', socket.nickname+': <span class="online">ist jetzt online</span>'+'</br>');
       }
      // UserIsBack();
    });	
	
	socket.on('Data', function(data, callback){ 
       var msg = data.trim();
       if(msg.substr(0,3) === '/w '){
           msg = msg.substr(3);
           console.log(msg);
           var ind = msg.indexOf(' ');
           if(ind !== -1){
               var name = msg.substring(0, ind);
               var msg = msg.substring(ind + 1);
               if(name in users){
                   users[name].emit('whisper', {msg: msg, nick: socket.nickname});
                   socket.emit('whisper', {msg: msg, nick: socket.nickname});
                          console.log("Whisper!");       
               } else{
                   callback('Dieser Benutzer existiert nicht');
               }
           }else{
               callback('Bitte eine Nachricht eingeben!');
           }
       }else{
           if(msg !== ""){
       io.sockets.emit('message', {msg: msg, nick: socket.nickname});
           }else{
               callback('Bitte eine Nachricht eingeben!');
           }
       }
	   
         //socket.broadcast.emit('new message', data);
    });  //var socketId = socket.id
	
		//Würfel abfrage
		socket.paschcounter = 0;
		SpielStart = 0;
		socket.SpielerRundenZahl = 0;
	   socket.on('roll', function(){
		if(SpielStart == 1){	
			   if(socket.PlayerActive == 1){
		var num1 = Math.floor((Math.random() * 6) + 1);
		var num2 = Math.floor((Math.random() * 6) + 1);
		io.sockets.emit('ServerMessege', socket.nickname+" hat "+num1+ " und " +num2+ " gewürfelt!");
		
		var Berechnung = (num1 + num2) + socket.PlayerPosition;
		//Berechnung = Position des Players
		
		
		if(Berechnung >= 40){
			var AltePlayerPosition = KartenMap[socket.PlayerPosition];
			NeueBerechnung = Berechnung - 40;
			console.log("Position Start: "+NeueBerechnung);
			io.sockets.emit('PositionDeleter', socket.nickname ,AltePlayerPosition);
			socket.PlayerPosition = NeueBerechnung;
			io.sockets.emit('Movment', socket.nickname , KartenMap[NeueBerechnung]);
			//Feld Event auslösen
			FeldOptionen(socket.nickname , NeueBerechnung);
		}else{
			var AltePlayerPosition = KartenMap[socket.PlayerPosition];
			io.sockets.emit('PositionDeleter', socket.nickname ,AltePlayerPosition);
			//Berechnung = Neue SpielerPosition
			socket.PlayerPosition = Berechnung;
			//Sende den Client's die neuen Angaben
			io.sockets.emit('Movment', socket.nickname , KartenMap[Berechnung]);
			//Feld Event auslösen
			FeldOptionen(socket.nickname , Berechnung);
		}

		if(num1 === num2) {
			socket.paschcounter = socket.paschcounter + 1;
			console.log("Pasch! Next");
			//console.log("pasch juhu darf nochma!"+socket.paschcounter);
			if (socket.paschcounter === 3) {
			    console.log("ab ins jail mit dir!");	
				socket.PlayerActive = 0;
				socket.paschcounter = 0;
			}
		}else{
			socket.paschcounter = 0;
			//Wirf den ersten Spieler in ein neuen Array
			BenutzerReihenFolge.push(socket.nickname);
			//Durchsuche das array nach den Spielern
			console.log(BenutzerReihenFolge.indexOf(Spieler1));
				if(BenutzerReihenFolge.indexOf(Spieler1) == -1){
					OnlineUsers[Spieler1].PlayerActive = 1;
					AktiverSpieler = Spieler1;
				}else if(BenutzerReihenFolge.indexOf(Spieler2) == -1){
					OnlineUsers[Spieler2].PlayerActive = 1;
					AktiverSpieler = Spieler2;
				}else if(BenutzerReihenFolge.indexOf(Spieler3) == -1){
					OnlineUsers[Spieler3].PlayerActive = 1;
					AktiverSpieler = Spieler3;
				}
			//Wenn Max Spiler Anzahl erreicht ist setze array zurück
			var Umrechnung = BenutzerReihenFolge.length + 1;
				console.log(Umrechnung + " Array Anzahl 1 or 2");
				console.log(SpielerAnzahl + " SpielerAnzahl");
			if(Umrechnung == SpielerAnzahl){
				delete BenutzerReihenFolge;
				BenutzerReihenFolge = [];
			}
			
			
			//Lösche den Aktiven Spieler
			socket.PlayerActive = 0;
			
			
			//Meldung ausgeben
			io.sockets.emit('ServerMessege' , 'Der Spieler '+ AktiverSpieler +' ist an der Reihe.');
			console.log(SpielerAnzahl);
		}
		
		}else{
			socket.emit('ServerMessege' , 'Du bist noch nicht an der Reihe mit würfeln!');
		}
		}else{
			socket.emit('ServerMessege' , 'Du kannst erst wüfeln sobald das Spiel gestartet ist!');
		}
	   });
	   
	   //Start Event
	   socket.on('StartEvent', function(){
			//Gucke spieler anzahl 
			SpielerAnzahl = Object.keys(OnlineUsers).length;
			if(SpielerAnzahl < 2){
				socket.emit('ServerMessege', 'Es müssen mindestens 2 Player vorhanden sein!');
				return;
			}
			SpielerName = Object.keys(OnlineUsers);
						
			var beginner = Math.floor((Math.random() * SpielerAnzahl) + 1);
			beginner--;
			//console.log(SpielerName[0]+SpielerName[1]);	
			Spieler1 = SpielerName[0];
			Spieler2 = SpielerName[1];
			Spieler3 = SpielerName[2];
			Spieler4 = SpielerName[3];
			Spieler5 = SpielerName[4];
			Spieler6 = SpielerName[5];
			Spieler7 = SpielerName[6];
			Spieler8 = SpielerName[7];
			console.log(Spieler1 + Spieler2 + Spieler3 + Spieler4 + Spieler5 + Spieler6 + Spieler7 + Spieler8);
			if(beginner == 0){
				io.sockets.emit('ServerMessege', Spieler1+" darf als erstes würfeln.");
				OnlineUsers[Spieler1].PlayerActive = 1;
				console.log(OnlineUsers[Spieler1].PlayerActive);
			}else if(beginner == 1){
				io.sockets.emit('ServerMessege', Spieler2+" darf als erstes würfeln.");
				OnlineUsers[Spieler2].PlayerActive = 1;
			}else if(beginner == 2){
				io.sockets.emit('ServerMessege', Spieler3+" darf als erstes würfeln.");
				OnlineUsers[Spieler3].PlayerActive = 1;
			}else if(beginner == 3){
				io.sockets.emit('ServerMessege', Spieler4+" darf als erstes würfeln.");
				OnlineUsers[Spieler4].PlayerActive = 1;
			}else if(beginner == 4){
				io.sockets.emit('ServerMessege', Spieler5+" darf als erstes würfeln.");
				OnlineUsers[Spieler5].PlayerActive = 1;
			}else if(beginner == 5){
				io.sockets.emit('ServerMessege', Spieler6+" darf als erstes würfeln.");
				OnlineUsers[Spieler5].PlayerActive = 1;
			}else if(beginner == 6){
				io.sockets.emit('ServerMessege', Spieler7+" darf als erstes würfeln.");
				OnlineUsers[Spieler5].PlayerActive = 1;
			}else if(beginner == 7){
				io.sockets.emit('ServerMessege', Spieler8+" darf als erstes würfeln.");
				OnlineUsers[Spieler5].PlayerActive = 1;
			}
			
			
			//Wer hat first blood`?
			//????????????????????????????????????????????????????????? :/
			//Setze Spieler auf Start
			SpielStart = 1;
			io.sockets.emit('StartTheGame', SpielerName);	
	   });
	   
	socket.on('disconnect', function () {
    console.log('user disconnected' +  socket.nickname);
	delete OnlineUsers[socket.nickname];
	updateNicknamesOnline();
	//var socketId = socket.id
	//console.log("Benuzer IP: "+BenutzerIp[0]+BenutzerIpName[0]+BenutzerIp[1]+BenutzerIpName[1]);
	});
});




	function updateNicknamesOnline(){
        io.sockets.emit('usernamesOnline', Object.keys(OnlineUsers)); 
    }
	function FeldOptionen(SpielerName, FeldPosNumber){
	//Prüfe ob der Artikel noch vorhanden ist.
	/*	TestArr.push('Testing');
	TestArr[0][0] = "2";
	test = KartenMap.length;
		console.log(test);
	TestArr.push('Testing');
	TestArr[0][1] = "3";*/
		if(Object.keys(GekaufeArtikel).indexOf(FeldPosNumber) == -1){
			//socket.emit('ServerMessege', 'Willst du den ')
			//Falls der Artikel gekauft wird
			/*GekaufeArtikel.push(FeldPosNumber);*/
			GekaufeArtikel[SpielerName] = FeldPosNumber;
						console.log(GekaufeArtikel);
			//Adde dem Spieler das Feld
		}
		var FeldId = KartenMap[FeldPosNumber];
		var FeldKosten = KostenMap[FeldPosNumber];
		//Ist dieses Feld schon an einen Spieler vergeben?
		
		//Cash abfrage und kauf option
	}
