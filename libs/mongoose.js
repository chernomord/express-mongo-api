var mongoose    = require('mongoose');
var log         = require('./log')(module);
var config = require('./config');

mongoose.connect(config.get('mongoose:uri'));

var db = mongoose.connection;

db.on('error', function (err) {
    log.error('connection error:', err.message);
});
db.once('open', function callback () {
    log.info("Connected to DB!");
});

var Schema = mongoose.Schema;

var Memo = new Schema({
    title: { type: String, required: true },
    author: { type: String, required: true },
    additional: {type: String, required: false},
    text: { type: String, required: true },
    modified: { type: Date, default: Date.now }
});

// validation
Memo.path('title').validate(function (v) {
    return v.length > 5 && v.length < 70;
});

var MemoModel = mongoose.model('Memo', Memo);

module.exports.MemoModel = MemoModel;