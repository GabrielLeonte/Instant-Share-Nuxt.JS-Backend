'use strict';

var sqlite3 = require('sqlite3').verbose();
const settings = require('./database-settings');

var db;

exports.Init = function(callback)
{
    const globalCallback = callback;
    
    db = new sqlite3.Database(settings.dbName);
    
    //db.run('DROP TABLE history');
    //db.run('ALTER TABLE orders ADD COLUMN uuid TEXT UNIQUE')
    
    
    
    function CreateTable(dbTables, nIndex, cbError)
    {
        var cols = ' (';
        for (var i=0; i<dbTables[nIndex].cols.length; i++) {
            cols += dbTables[nIndex].cols[i][0] + ' ' + dbTables[nIndex].cols[i][1];
            
            if (i != dbTables[nIndex].cols.length-1)
                cols += ', ';
        }
        
        if (dbTables[nIndex].commands) cols += ", "+dbTables[nIndex].commands;
    
         cols += ')';
         
         db.run('CREATE TABLE IF NOT EXISTS ' + dbTables[nIndex].name + cols, function(err) {
            if (!err)
            {
                cbError(false);
                return;
                console.log("Done");
            }
                
            console.log(err.message);
            cbError(true);
         });
    }
    
    function Delete(table, where, callback)
    {
        try
        {
            db.run('DELETE FROM ' + table + ' WHERE ' + where, function(err) {
                if (callback) setTimeout(callback, 1, err); //callback(err)
                if (!err) 
                    return;
                console.log('DELETE error: ' + err.message);
            });
            
        }
        catch(e)
        {
            if (callback) setTimeout(callback, 1, e); //callback(e);
            console.log(e.message);
        }
    }
    
    function Insert(tableObject, values)
    {
        InsertCommon(tableObject, values, false);
    }
    function Insert2(tableObject, values)
    {
        InsertCommon(tableObject, values, true);
   }
    function InsertCommon(tableObject, values, bToMemory)
    {
        try {
            var callbackERR = values[values.length-1];
            
            if (values.length-1 != tableObject.cols.length ) {
                console.log('ERROR: Insert to table "'+tableObject.name+'" failed arguments count: ' + (values.length-1));
                
                return setTimeout(callbackERR, 1, true); //callbackERR(true);
            }
            
            var vals = ' (';
            for (var i=0; i<values.length-1; i++) {
                vals += "'" + escape(values[i]) + "'";
                
                if (i != values.length-2)
                    vals += ', ';
            }
            vals += ')';
            
            console.log('INSERT INTO ' + tableObject.name + ' VALUES ' + vals);
            if (bToMemory)
            {
                exports.addMemQuery('INSERT INTO ' + tableObject.name + ' VALUES ' + vals);
                setTimeout(callbackERR, 1, false);//callbackERR(false);
            }
            else
            {
                db.run('INSERT INTO ' + tableObject.name + ' VALUES ' + vals, function(err) {
                    if (callbackERR) setTimeout(callbackERR, 1, err); //callbackERR(err);
                    if (err) 
                        console.log('INSERT error: ' + err.message);
                    else
                        console.log('INSERT success');
                });
            }
        }
        catch(e) {
            console.log(e.message);
            if (callbackERR) setTimeout(callbackERR, 1, e); //callbackERR(e);
        }
    }
    function SelectAll(cols, table, where, other, callback, param) 
    {
        try {
            let query = "SELECT " + cols + " FROM " + table;
            if (where.length)
                query += " WHERE " + where;
            if (other.length)
                 query += " " + other; 
                 
            if (!callback) 
                console.log("WARNING: SelectAll callback undefined!!!");

            db.all(query, param, (err, rows) => {
                if (err) 
                    console.log("SELECT ERROR: query="+query+" message=" + err.message);
                
                query = null;
                if (callback) setTimeout(callback, 1, err, rows);
            });        
        }
        catch (e) {
            console.log(e.message);
            if (callback) setTimeout(callback, 1, e, []); //callback(e);
        }
    }
    function Update(tableName, SET, WHERE, callback)
    {
        try {
            let query = 'UPDATE ' + tableName;
            console.log(query); 
            
            if (!SET || !SET.length)  throw new Error("Table Update MUST have 'SET'");
            if (!WHERE || !WHERE.length) throw new Error("Table Update MUST have 'WHERE'");
                
            query += ' SET ' + SET;
            query += ' WHERE ' + WHERE;
            
            //console.log(query);   
            db.run(query, function(err) {
                if (callback) setTimeout(callback, 1, err); //callback(err);
                if (err) console.log("UPDATE error: " + err.message);
            });
        }
        catch(e) {
            console.log(e.message);
            if (callback) setTimeout(callback, 1, e); //callback(e);
        }
    }
    
    db.parallelize(function(){
        
        ForEachSync(settings.dbTables, CreateTable, function(err) {
            if (err) throw new Error('unexpected init db error 2');

            
            if (globalCallback)
                globalCallback();
                
        }, function(err, params, cbError){
            if (err) throw new Error('unexpected init db error 1');
            
            const i = params.nIndex;
            
            settings.dbTables[settings.dbTables[i]['name']] = settings.dbTables[i];
           
            settings.dbTables[i]['insert'] = function() {
                Insert(this, arguments);};
            settings.dbTables[i]['insert2'] = function() {
                Insert2(this, arguments);};

            settings.dbTables[i]['Insert'] = function() {
                let args = [];
                for (let i = 0; i < arguments.length; i++) {
                  args[i] = arguments[i];
                }
                return new Promise((fulfilled, rejected) => {
                    args.push(err => { 
                        if (err) return rejected( new Error(err.message || "Insert error") );
                        fulfilled(null);
                    });
                    Insert(this, args);
                });
            };
            
            settings.dbTables[i]['update'] = function(SET, WHERE, callback) {
                Update(this.name, SET, WHERE, callback);};
            
            settings.dbTables[i]['Update'] = function(SET, WHERE) {
                const name = this.name;
                return new Promise((fulfilled, rejected) => {
                    Update(name, SET, WHERE, err => {
                        if (err) return rejected( new Error(err.message || "Update error") );
                        fulfilled(null);
                    });
                });
             };
            
            settings.dbTables[i]['delete'] = function(WHERE, callback) {
                Delete(this.name, WHERE, callback);};
            
            settings.dbTables[i]['selectAll'] = function(cols, where, other, callback, param) {
                SelectAll(cols, this.name, where, other, callback, param);};
            
            settings.dbTables[i]['Select'] = function(cols, where = "", other = "", param) {
                const name = this.name;
                return new Promise((fulfilled, rejected) => {
                    SelectAll(cols, name, where, other, (err, rows) => {
                        if (err || !rows) return rejected( new Error(err && err.message ? err.message : "Select error") );
                        fulfilled(rows);
                    }, param);
                });
            };
            
            cbError(false);
        });
    });
};

let txLog = "";
let g_gotTransaction = false;
exports.BeginTransaction = function (log, callback, count)
{
    const counter = count || 0;
    if (g_gotTransaction && counter <= 3)
        return setTimeout(exports.BeginTransaction, 5000, log, callback, counter+1);
    
    if (g_gotTransaction && counter > 3)
        return callback({message: 'Transactions busy '+txLog});

    g_gotTransaction = true;   
    txLog = log;
    db.run('BEGIN TRANSACTION', function(err){
        if (err) g_gotTransaction = false;
        //if (err) throw ("BeginTransaction error: " + err.message);
        if (callback) callback(err);
    });
};

var g_memQueries = [];
exports.addMemQuery = function(strQuery) 
{
    if (!strQuery || !strQuery.length) throw new Error('invlid SQL query');
    
    g_memQueries.push(strQuery);
};



function ForEachSync(array, func, cbEndAll, cbEndOne)
{
    if (!array || !array.length)
    {
        console.log('success: ForEachAsync (!array || !array.length)');
        cbEndAll(false);
        return;
    }
    
    Run(0);
    
    function Run(nIndex)
    {
        if (nIndex >= array.length) throw new Error('error: ForEachSync_Run (nIndex >= array.length)');
        func(array, nIndex, onEndOne);
        
        function onEndOne(err, params)
        {
            if (!cbEndOne)
            {
                if (err) return cbEndAll(err);
                
                if (nIndex+1 < array.length && !err)
                    Run(nIndex+1);
                else
                    cbEndAll(false); //if all processed then stop and return from 'ForEachSync'
                return;
            }
            
            if (!params) params = {};
            
            params.nIndex = nIndex;
            
            cbEndOne(err, params, function(error) {
                if (error) {
                    //if func return error, then stop and return from 'ForEachSync'
                    console.log('error: ForEachSync_Run_cbEndOne return error');
                    return cbEndAll(true);
                }
                if (nIndex+1 < array.length)
                    Run(nIndex+1);
                else
                    cbEndAll(false); //if all processed then stop and return from 'ForEachSync'
            });
        }
    }
};
