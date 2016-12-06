// app/routes.js
module.exports = function(app, passport, io) {

	// =====================================
	// HOME PAGE (with login links) ========
	// =====================================
	var heartbeats = require('heartbeats');
	var heart = heartbeats.createHeart(1000);
	var onlineusers ={};
	var clients = {};
	//var userScreenShot={};
	/*heart.createEvent(5, function(count, last){
	   if(count%10==0){
    		for (var key in onlineusers) {
			  if (onlineusers.hasOwnProperty(key)) {
			    if(userScreenShot[key] == onlineusers[key]){
			    	delete onlineusers[key];
			    	console.log("one deleted!!!!");
			    }
			  }
			}
			userScreenShot = JSON.parse(JSON.stringify(onlineusers));
  		}
	});
	*/
	app.get('/', function(req, res) {
		if (req.isAuthenticated())
			res.redirect('/home');
		res.render('index.ejs'); // load the index.ejs file
	});

	// =====================================
	// LOGIN ===============================
	// =====================================
	// show the login form
	/*
	app.get('/onlineusers', function(req, res) {
		res.setHeader('Content-Type', 'application/json');
		if (req.isAuthenticated()){
			if (!onlineusers[req.user.local.email]){
				onlineusers[req.user.local.email] =0;
			}
			onlineusers[req.user.local.email]= (onlineusers[req.user.local.email]+1)%100;
			console.log(JSON.stringify(onlineusers));
			res.json(onlineusers);
		}
		else{
			res.json({});
		}
	});*/

	app.get('/login', function(req, res) {
		if (req.isAuthenticated())
			res.redirect('/home');
		// render the page and pass in any flash data if it exists
		res.render('login.ejs', { message: req.flash('loginMessage') });
	});

	// process the login form
	app.post('/login', passport.authenticate('local-login', {
		successRedirect : '/home', // redirect to the secure profile section
		failureRedirect : '/login', // redirect back to the signup page if there is an error
		failureFlash : true // allow flash messages
	}));
	/* {
		successRedirect : '/home', // redirect to the secure profile section
		failureRedirect : '/login', // redirect back to the signup page if there is an error
		failureFlash : true // allow flash messages
	}));*/


	// =====================================
	// SIGNUP ==============================
	// =====================================
	// show the signup form
	app.get('/signup', function(req, res) {
		if (req.isAuthenticated())
			res.redirect('/home');
		// render the page and pass in any flash data if it exists
		res.render('signup.ejs', { message: req.flash('signupMessage') });
	});

	// process the signup form
	app.post('/signup', passport.authenticate('local-signup', {
		successRedirect : '/home', // redirect to the secure profile section
		failureRedirect : '/signup', // redirect back to the signup page if there is an error
		failureFlash : true // allow flash messages
	}));

	// =====================================
	// PROFILE SECTION =========================
	// =====================================
	// we will want this protected so you have to be logged in to visit
	// we will use route middleware to verify this (the isLoggedIn function)
	app.get('/profile', isLoggedIn, function(req, res) {
		if (!req.isAuthenticated())
			res.redirect('/');
		res.render('profile.ejs', {
			user : req.user // get the user out of session and pass to template
		});
	});

	// =====================================
	// LOGOUT ==============================
	// =====================================
	app.get('/logout', function(req, res) {
		req.logout();
		res.redirect('/');
	});

	app.get('/home', isLoggedIn, function(req, res) {
		if (!req.isAuthenticated())
			res.redirect('/');
		res.render('home.ejs', {
			user : req.user // get the user out of session and pass to template
		});
	});

	io.on('connection', function(socket){
		socket.on('chat message', function(msg){
			console.log(msg);
			io.emit('chat message', msg);
		});

		socket.on('disconnect', function () {
	        var userID = clients[socket.id];
	        if (onlineusers[userID])
	        	onlineusers[userID]--;
	        if (onlineusers[userID] == 0){
	        	delete onlineusers[userID];
	        	io.emit('user list', onlineusers);
	        }
	        delete clients[socket.id];
	        if (userID)
	        	console.log(userID +' disconnected.');
	        console.log(JSON.stringify(onlineusers));
		});

		socket.on('user online', function (msg) {
			if (!onlineusers[msg]){
				onlineusers[msg] =0;
			}
			onlineusers[msg]++;
			console.log(msg+" is online now");
    		console.log(JSON.stringify(onlineusers));
    		clients[socket.id] = msg;
    		io.emit('user list', onlineusers);
		});
	});
};

// route middleware to make sure
function isLoggedIn(req, res, next) {

	// if user is authenticated in the session, carry on
	if (req.isAuthenticated())
		return next();

	// if they aren't redirect them to the home page
	res.redirect('/');
}
