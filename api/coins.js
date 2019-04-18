const sqlite3 = require('sqlite3').verbose();
const database = new sqlite3.Database("./database/sqlite.db");

module.exports = function (req, res){
    database.all(`SELECT name, ticker, icon FROM coins`, (err, row) => {
		res.send(row);
	});
}