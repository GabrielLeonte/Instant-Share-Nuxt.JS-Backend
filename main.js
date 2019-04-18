"use strict";

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const db = require('./database');

//Database Setup
const sqlite3 = require('sqlite3').verbose();
const database = new sqlite3.Database("./database/sqlite.db");

if (process.argv[2] == "-create-db") {
	db.Init();
}

//API Server
const app = express();
const router = express.Router();
app.use(cors());
app.use(router);
router.use(bodyParser.urlencoded({
	extended: false
}));
router.use(bodyParser.json());

//Socket.IO Server
var server = require('http').createServer(app);
var io = require('socket.io')(server);


//Load WebSockets and 
require('./reqHandler').handle(app, router, io, database);


//API Server Listen
app.listen(3333, () => {
	console.log('\nAPI Server listening at http://localhost:3333\n');
});

//Socket.IO Server Listen
server.listen(8080, () => {
	console.log('Socket.IO Server listening at http://localhost:8080\n');
});