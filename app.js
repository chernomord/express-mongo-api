var express = require('express');
var path = require('path');
var log = require('./libs/log')(module);
var config = require('./libs/config');
var bodyParser = require('body-parser');

var app = express();


// app.use(express.favicon()); // отдаем стандартную фавиконку, можем здесь же свою задать
// app.use(express.logger('dev')); // выводим все запросы со статусами в консоль
// app.use(express.bodyParser()); // стандартный модуль, для парсинга JSON в запросах
// app.use(cookieParser());
// app.use(express.methodOverride()); // поддержка put и delete
// app.use(app.router); // модуль для простого задания обработчиков путей
app.use(express.static(path.join(__dirname, "public"))); // static server


app.get('/api', function (req, res) {
    res.send('API is running');
});

// CRUD START

var jsonParser = bodyParser.json({ type: 'application/json'});

var MemoModel = require('./libs/mongoose').MemoModel;

app.get('/api/memos', function (req, res) {
    return MemoModel.find(function (err, memoes) {
        if (!err) {
            return res.send(memoes)
        } else {
            res.statusCode = 500;
            log.error('Internal error(%d): %s', res.statusCode, err.message);
            return res.send({error: 'Server error'});
        }
    })
});

app.post('/api/memos', jsonParser, function (req, res) {
    console.dir(req.body);
    var memo = new MemoModel({
        title: req.body.title,
        author: req.body.author,
      additional: req.body.additional,
        text: req.body.text,
    });

    memo.save(function (err) {
        if (!err) {
            log.info("memo created");
            return res.send({status: 'OK', memo: memo});
        } else {
            console.log(err);
            if (err.name == 'ValidationError') {
                res.statusCode = 400;
                res.send({error: 'Validation error'});
            } else {
                res.statusCode = 500;
                res.send({error: 'Server error'});
            }
            log.error('Internal error(%d): %s', res.statusCode, err.message);
        }
    })
});

app.get('/api/memos/:id', function (req, res) {
    return MemoModel.findById(req.params.id, function (err, article) {
        if (!article) {
            res.statusCode = 404;
            return res.send({error: 'Not found'});
        }
        if (!err) {
            return res.send({status: 'OK', article: article});
        } else {
            res.statusCode = 500;
            log.error('Internal error(%d): %s', res.statusCode, err.message);
            return res.send({error: 'Server error'});
        }
    });
});

app.put('/api/memos/:id', jsonParser, function (req, res) {
    return MemoModel.findById(req.params.id, function (err, memo) {
        if(!memo) {
            res.statusCode = 404;
            return res.send({ error: 'Not found' });
        }
        memo.title = req.body.title;
        memo.text = req.body.text;
        memo.author = req.body.author;
        return memo.save(function (err) {
            if (!err) {
                log.info("article updated");
                return res.send({ status: 'OK', memo:memo });
            } else {
                if(err.name == 'ValidationError') {
                    res.statusCode = 400;
                    res.send({ error: 'Validation error' });
                } else {
                    res.statusCode = 500;
                    res.send({ error: 'Server error' });
                }
                log.error('Internal error(%d): %s',res.statusCode,err.message);
            }
        });
    });
});

app.delete('/api/memos/:id', function (req, res) {
    return MemoModel.findById(req.params.id, function (err, memo) {
        if(!memo) {
            res.statusCode = 404;
            return res.send({ error: 'Not found' });
        }
        return memo.remove(function (err) {
            if (!err) {
                log.info("article removed");
                return res.send({ status: 'OK' });
            } else {
                res.statusCode = 500;
                log.error('Internal error(%d): %s',res.statusCode,err.message);
                return res.send({ error: 'Server error' });
            }
        });
    });
});

// CRUD END


app.use(function (req, res, next) {
    res.status(404);
    log.debug('Not found URL: %s', req.url);
    res.send({error: 'Not found'});
    next();
});

app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    log.error('Internal error(%d): %s', res.statusCode, err.message);
    res.send({error: err.message});
    next();
});


app.listen(config.get('port'), function () {
    log.info('Express server listening on port 1337');
});