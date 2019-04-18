const bcrypt = require('bcryptjs');
const sqlite3 = require('sqlite3').verbose();
const database = new sqlite3.Database("./database/sqlite.db");

module.exports = function (req, res) {
	const name = req.body.username;
	const email = req.body.email;
	const password = bcrypt.hashSync(req.body.password);


	database.run(`INSERT INTO users (name, email, password) VALUES (?,?,?)`, [name, email, password], (err) => {
		if (err) {
			console.log(err);
		} else {

			database.get(`SELECT id FROM users WHERE email="${email}"`, function (err, id) {
				if (err) {
					console.log(err);
				} else {
					database.each(`SELECT name FROM coins`, (err, coin_name) => {
						if (err) {
							console.log(err)
						} else [
							database.run(`INSERT INTO user_balance values (?,?,?,?,?)`, [id.id, coin_name.name, 0, 0, 0], function (err) {
								if (err) {
									console.log(err)
								} else {
									res.status(200).send()
								}
							})
						]

					});
				}
			});
		}
	});
}