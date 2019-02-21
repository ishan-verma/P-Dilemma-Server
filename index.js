var express = require('express');
var app = express();
var bodyParser = require("body-parser");
var request = require('request');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

/*
 *  alan's comment:
 *
 *  Perhaps setting up views might have made it more concrete to debug, but ultimately
 *  rendering html for consumption by a browser was not a requirement of this exercise.
 *  This is good feedback for me actually.  I should probably clarify in the doc that
 *  both the client and server can be simple http services.  My intention was that starting the server would
 *  initiate the main behavior loop, whereby it would repeatedly call /decision on each of the clients
 *  and then post back to /outcome, all without any human intervention as if they are backend services communicating.
 *
 *  However, I think using browser-driven approach (ie. submitting a form in a browser initiates a round to begin)
 *  creates some extra complexities that need to be addressed (eg. the lack of syncing between the "client"
 *  view and the client "server").  The client scripts are stateful and both need to receieve
 *  a request to either /cooperate or /defect before the server can correctly handle a request to /next-round.
 *
 *
 */
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
  /*
   *  alan's comment:
   *
   *  The `arguments` keyword in javascript can be a good way to access an arguments
   *  list of an unknown length, but in this situation we already know that there should be
   *  exactly two arguments so it might be better to define them specifically in the function signature.
   *  Using named arguments doesn't stop you from using the argument spread operator ("...") as you do below.
   *
   */
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
  /*
   *  alan's comment:
   *
   *  style nitpack: this could instead just be `res.send([p1, p2])`
   *
   */
    var data =[];
    data.push(p1);
    data.push(p2);
    res.send(data);
});



//POST request for setting name by clients
app.post("/add-player1", function(req, res) {
    p1.playerName=req.body.name;
    console.log(req.body);
  /*
   *  alan's comment:
   *
   *  I think we're missing a redirect here?  The issue is masked because
   *  the browser refreshes the page after the form submits (which, speculating here,
   *  causes the request to error after the socket is closed by the browser), but
   *  other wise the request would hang (until a timeout is reached) and in a real server situation would cause
   *  the server quickly fill up with hung requests.
   *
   *
   */
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

  /*
   *  alan's comment:
   *
   *  style nitpick: people write JS variable names in both camel case and snake case, but I
   *  recommend within a single codebase to stick to the same convention.
   *
   */

  /*
   *  alan's comment:
   *
   *  This loop might feel cleaner if we are looping by the players themselves (eg. an id)
   *  and then the users are generated from some utility function that generates the correct
   *  url from the player id.
   *
   */

  /*
   *  alan's comment:
   *
   *  I know you're new to node.js and so I wouldn't expect you to know promises yet,
   *  but using promise chains (or async functions, or generators) to implement these requests
   *  might make it a bit easier to track when all the requests are completed.
   *
   */
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
