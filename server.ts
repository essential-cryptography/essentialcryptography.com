import * as fs from 'fs';
import * as http from "http";
import * as url from "url";
import * as express from "express";
import * as bodyParser from "body-parser";
import errorHandler = require("errorhandler");

var app = express();

app.use( bodyParser.urlencoded( { extended: true } ) );
app.use( bodyParser.json() );

var env = process.env.NODE_ENV || 'development';
if ( env === 'development' ) {
  app.use( errorHandler() );

  let expressLogging = require('express-logging'),
      logger = require('logops');

  app.use(expressLogging(logger));
}

// Mount public as '/'
app.use( express.static(__dirname + '/../public') );

app.get( '/',  (req, resp, done) => {
  resp.redirect( '/jornada-do-criptografo.html' );
} );

// mount /api
app.post( '/api/subscribe', (req, resp, done) => {
  let info: { name: string, email: string, origin: string, lang: string, type: string } = req.body;
  let userName = info.name;
  let userEmail = info.email;

  fs.appendFile('subscribers.txt', JSON.stringify( info )+',', function (err) {
    if ( !err )
      done();
  });

  var config = JSON.parse( fs.readFileSync("config.json", 'utf8') );
  var auth = config.subscribe.auth;
  var nodemailer = require('nodemailer');

  // create reusable transporter object using the default SMTP transport
  var transporter = nodemailer.createTransport( config.subscribe.options );

  // setup e-mail data with unicode symbols
  var mailOptions = {
      from: config.subscribe.from, //'"Criptografia Essencial" <subscribe@cryptographix.org>', // sender address
      to: 'sean.wykes@nascent.com.br', // list of receivers
      subject: 'Hello ✔', // Subject line
      text: 'Hello world' + JSON.stringify( info ), // plaintext body
      html: '<b>Hello world 🐴</b><br/>'+'<p>'+JSON.stringify( info )+'</p>' // html body
  };

  // send mail with defined transport object
  transporter.sendMail(mailOptions, function(error, info){
      if(error){
          return console.log(error);
      }
      console.log('Message sent: ' + info.response);
  });

} );

//
let port = 8400;
app.listen( port, ()=>{
  console.log("Essential Cryptography submit server listening on port %d in %s mode", port, app.settings.env );
} );

export var App = app;
