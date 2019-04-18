exports.dbName = './database/sqlite.db';

exports.dbTables = [
   {
      'name' : 'users',
      'cols' : [
          ['id', 'integer PRIMARY KEY'],
          ['name', 'TEXT'],
          ['email', 'TEXT UNIQUE'],
          ['password', 'TEXT'],
          ['is_admin', 'INT DEFAULT 0']
        ]
   },
   {
      'name' : 'coins',
      'cols' : [
          ['coin_id', 'INT UNIQUE PRIMARY KEY'],
          ['name', 'TEXT'],
          ['ticker', 'TEXT'],
          ['rpc_host', 'TEXT'],
          ['rpc_user', 'TEXT'],
          ['rpc_password', 'TEXT'],
          ['rpc_port', 'TEXT'],
          ['icon', 'TEXT']
        ]
   },
   {
      'name' : 'user_balance',
      'cols' : [
          ['user_id', 'TEXT'],
          ['name', 'TEXT'],
          ['balance', 'TEXT DEFAULT 0'],
          ['deposit_address', 'TEXT NULL'],
          ['total_deposit', 'TEXT DEFAULT 0'],
          ['total_withdraw', 'TEXT DEFAULT 0']
        ]
   }
];

exports.dbIndexes = [
  {
    'name' : 'uid',
    'table' : 'balance',
    'fields' : 'userID'
  },
  {
    'name' : 'uid_orders',
    'table' : 'orders',
    'fields' : 'userID, coin, buysell, amount, price'
  },
  {
    'name' : 'history_index',
    'table' : 'history',
    'fields' : 'buyUserID, sellUserID, coin, coin_pair, time'
  },
];