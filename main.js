"use strict";
const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const database = new sqlite3.Database("./database/sqlite.db");
const db = require('./database');
const SECRET_KEY = "Wallet/ForEverybody/oFcoyrse";

//Database Setup
if (process.argv[2] == "-create-db") {
	db.Init();
}

//API Server
const app = express();
const router = express.Router();
app.use(router);
app.use(cors());

router.use(bodyParser.urlencoded({
	extended: false
}));
router.use(bodyParser.json());

//WebSockets Server
var server = require('http').createServer(app);
var io = require('socket.io')(server);

//Main Page
router.get('/', (req, res) => {
	res.status(200).send('This is an authentication server');
});

const findUserByEmail = (email, cb) => {
	return database.get(`SELECT * FROM users WHERE email = ?`, [email], (err, row) => {
		cb(err, row)
	});
}

//API POST'S & GET'S
router.post('/api/register', (req, res) => {
	const name = req.body.username;
	const email = req.body.email;
	const password = bcrypt.hashSync(req.body.password);

	database.run(`INSERT INTO users (name, email, password) VALUES (?,?,?)`, [name, email, password], (err) => {
		if (err) {
			console.log(err);
		} else {
			database.get(`SELECT id, name, email FROM users WHERE name = ?`, [name], (err, userinfos) => {
				if (err) {
					console.log(err);
				} else {
					res.status(200).send({
						status: 'Success'
					})
				}

			})
		}
	});
});

router.post('/api/login', (req, res) => {
	const email = req.body.email;
	const password = req.body.password;
	findUserByEmail(email, (err, user) => {
		if (err) return res.status(500).send('Server error!');
		if (!user) return res.status(406).send({
			status: 'error',
			message: 'User not found!'
		});
		const result = bcrypt.compareSync(password, user.password);
		if (!result) return res.status(401).send({
			status: 'error',
			message: 'Password not valid!'
		});

		const accessToken = jwt.sign({
			uid: user.id
		}, SECRET_KEY);
		res.status(200).send({
			"status": "success",
			"data": {
				"type": "bearer",
				"token": accessToken,
				"refreshToken": null
			}
		});
	});
});

app.get('/api/me', (req, res) => {

	const header = req.headers['authorization'];

	if (typeof header !== 'undefined') {
		const bearer = header.split(' ');
		const token = bearer[1];

		req.token = token;

		jwt.verify(req.token, SECRET_KEY, (err, authorizedData) => {
			if (err) {
				//If error send Forbidden (403)
				console.log('ERROR: Could not connect to the protected route');
				res.sendStatus(403);
			} else {
				database.get(`SELECT id, name, email, is_admin FROM users WHERE id = ${authorizedData.uid}`, (err, row) => {
					if (err) console.log(err);
					//If token is successfully verified, we can send the autorized data 
					res.json({
						status: 'success',
						data: {
							id: row.id,
							username: row.name,
							email: row.email,
							is_admin: row.is_admin
						}
					});
				});
			}
		});

	} else {
		res.sendStatus(403)
	}

});

app.post('/api/me/coins', (req, res) => {
	database.all(`SELECT * FROM userbalance`, (err, row) => {
		res.send(row);
	});

});

//WebSocket Events

io.on('connection', function (socket) {
	let clients = 0;
	clients += 1;
	console.log(`Now are ${clients} clients`)

	socket.on('disconnect', function () {
		clients -= 1;
		console.log(`Now are ${clients} clients`)
	});

	socket.on('emit_method', function (data) {
		console.log(data);
	  });
});

//API Server Listen
app.listen(3333, () => {
	console.log('\nAPI Server listening at http://localhost:3333\n');
});

//SOCKET.IO Server Listen
server.listen(8080, () => {
	console.log('Socket.IO Server listening at http://localhost:8080\n');
});