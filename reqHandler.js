exports.handle = function (app, router, io, database) {

	//API POST'S & GET'S
	const register = require('./api/register');
	const login = require('./api/login');
	const me = require('./api/me');
	const coins = require('./api/me/coins');

	router.get('/api/me', me);
	router.post('/api/register', register);
	router.post('/api/login', login);
	router.post('/api/coins', coins);

	//Socket.Io Connection
	io.on('connection', function (socket) {

		socket.on('getDepositAddress', function(coin, userID){
			console.log('coin:' + coin)
			console.log('userID:' + userID)
			socket.emit('deposit_address', 'eCW724JbP5S3ib6YmqsassuNaN3Tbq1ZqR')
		});

		database.all(`SELECT name, ticker, icon FROM coins`, (err, row) => {
			socket.emit('deposit_withdraw', row);
		});


		socket.on('getBalance', function (userid) {
			database.all(`SELECT name, balance FROM user_balance where user_id = ${userid}`, function (err, row) {
				socket.emit('getBalance', row)
			})

		});


		setInterval(function () {
			return socket.emit('ping', Date.now());
		}, 2000)

	});

}
