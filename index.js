var express = require('express');
var app = express();
var bodyParser = require("body-parser");
var request = require('request');


app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set('view engine', 'ejs');

var n = 0;
var p1 = {
    playerName: 'p1',
    playerScore: 0
};
var p2 = {
    playerName: 'p2',
    playerScore: 0
};


/*
    
    |_1\2_|___Co____|____De___|
    |_Co__|[100,100]|[ 0,150 ]|
    |_De__|[ 150,0 ]|[ 25,25 ]|

*/

//parameter: decision & output: array of size two, containing scores for p1&p2 [scores1, score2]
function getScores(){
    console.log(arguments);
    if(arguments[0].decision=="cooperate"&&arguments[1].decision=="cooperate"){
        return [100,100];
    }
    else if(arguments[0].decision=="cooperate"&&arguments[1].decision=="defect"){
        return [150,0];
    }
    else if(arguments[0].decision=="defect"&&arguments[1].decision=="cooperate"){
        return [0,150];
    }
    else{
        return [25,25];
    }
}

//GET end point for scores
app.get('/scores', function (req, res) {
    var data =[];
    data.push(p1);
    data.push(p2);
    res.send(data);
});



//POST request for setting name by clients
app.post("/add-player1", function(req, res) {
    p1.playerName=req.body.name;
    console.log(req.body);
});
app.post("/add-player2", function(req, res) {
    p2.playerName=req.body.name;
    res.redirect("/scores");
});

//array to hold decision [{decision:"cooperate/defect"},{decision:"cooperate/defect"}]
var decisions = [];
//POST request to calculate scores for the round and go to next round
app.post("/next-round", function(req, res) {
    n=n+1;
    var urls = ['http://127.0.0.1:8081/decision', 'http://127.0.0.1:8082/decision'];
    var completed_requests = 0;
    for (let i =0 ; i< 2;i++) {
        request(urls[i], function (error, response, body) {
            decisions[i]=JSON.parse(body);
            completed_requests++;
            if (completed_requests == urls.length) {
                 var x = getScores(...decisions);
                 p1.playerScore = p1.playerScore + x[0];
                 p2.playerScore = p2.playerScore + x[1];
                 decisions=[];
            }
        })
    }
    res.redirect("/");
});



app.get("/", function(req, res) {
    
    if(n<10){
        res.render("index",{n:n});
        
    }
    else{
        
        if(p1.playerScore>p2.playerScore){
            res.send("Player 1 WON!");
        }
        else if(p1.playerScore==p2.playerScore) {
            res.send("TIE");
        }
        else{
            res.send("Player 2 WON!");
        }
    }
    
});

app.listen(8080, function () {
  console.log('Server Running on PORT: '+ 8080);
  
});