const jwt = require('jsonwebtoken');
const sqlite3 = require('sqlite3').verbose();
const database = new sqlite3.Database("./database/sqlite.db");
const SECRET_KEY = "Wallet/ForEverybody/oFcoyrse";

module.exports = function (req, res){
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

}

