#!/usr/bin/env node
var express = require('express'),
    path    = require('path'),
    parseopt= require('parseopt'),
    handlebars = require('handlebars'),
    log4js  = require('log4js'),
    Server  = require('./appserver.js'),
    config  = require('./config.js');

var parser = new parseopt.OptionParser(
  {
    options: [
      {
        name: "--autolaunch",
        default: false,
        type: 'flag',
        help: 'Automatically launch a code-search backend server.'
      },
      {
        name: "--production",
        default: false,
        type: 'flag',
        help: 'Enable options for a production deployment.'
      }
    ]
  });

var opts = parser.parse();
if (!opts) {
  process.exit(1);
}

if (opts.options.autolaunch) {
  console.log("Autolaunching a back-end server...");
  require('./cs_server.js')
}

var app = express.createServer();
var logger = log4js.getLogger('web');
app.use(log4js.connectLogger(logger, {
                               level: log4js.levels.INFO,
                               format: ':remote-addr [:date] :method :url'
                             }));

app.configure(
  function() {
    app.register('.html', require('handlebars'));
    app.set('view engine', 'html');
    app.set('view options', {
              production: opts.options.production
            });
    app.set('views', path.join(__dirname, 'templates'));
    app.use(express.bodyParser());
    app.use(express.static(path.join(__dirname, 'htdocs')));
  });

app.get('/', function (req, res) {
          res.render('index',
                     {
                       js: true,
                       title: 'search'
                     });
        });
app.get('/about', function (req, res) {
          res.render('about',
                     {
                       title: 'about'
                     });
        });
app.post('/feedback', function (req, res) {
           console.log(req.body);
           res.contentType('application/json');
           res.send(JSON.stringify({}));
         });

app.listen(8910);
console.log("http://localhost:8910");

var io = require('socket.io').listen(app, {
                                       logger: log4js.getLogger('socket.io'),
                                       'log level': log4js.levels.INFO
                                     });
io.configure(
  function() {
    io.enable('browser client gzip');
  });

var server = new Server(config, io);
