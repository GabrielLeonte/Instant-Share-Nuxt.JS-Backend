const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const sqlite3 = require('sqlite3').verbose();
const database = new sqlite3.Database("./database/sqlite.db");
const SECRET_KEY = "Wallet/ForEverybody/oFcoyrse";

module.exports = function (req, res){
	const email = req.body.email;
	const password = req.body.password;
	database.get(`SELECT * FROM users WHERE email = ?`, [email], (err, user) => {
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
}
