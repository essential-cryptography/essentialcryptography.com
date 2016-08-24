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
if ( env == 'development' ) {
  app.use( errorHandler() );

  let expressLogging = require('express-logging'),
      logger = require('logops');

  app.use(expressLogging(logger));
  console.log( 'Request Logging enabled' );
}

// Mount public as '/'
app.use( express.static(__dirname + '/../public') );

app.get( '/',  (req, resp, done) => {
  resp.redirect( '/jornada-do-criptografo.html' );
} );

let trackerPNG = fs.readFileSync('public/static/images/1x1.png');
app.get( '/tracker/1x1/:id', (req, resp, done) => {
  fs.appendFile('tracked.txt', req.params.id+',\n', function (err) {
    resp.writeHead(200, {'Content-Type': 'image/png' } );
    resp.end( trackerPNG, 'binary' );
    done();
  } );
} );

app.get( '/subscribe/confirm/:id', (req, resp, done) => {
  fs.appendFile('confirmed.txt', req.params.id+',\n', function (err) {
    //if ( !err )

    resp.redirect('https://d335luupugsy2.cloudfront.net/cms%2Ffiles%2F3775%2F1471523880E-sample-Wykes_Criptografia_Essencial_1ed.pdf');

    done();
  });

} );

var nodemailer = require('nodemailer');
var config = JSON.parse( fs.readFileSync("config.json", 'utf8') );
// create reusable transporter object using the default SMTP transport
var transporter = nodemailer.createTransport( config.subscribe.options );

function sendMail( template, info, cb ) {
  var auth = config.subscribe.auth;

  let userName = info.name;
  let userEmail = info.email;

  // setup e-mail data with unicode symbols
  var mailOptions = {
      from: config.subscribe.from, //'"Criptografia Essencial" <subscribe@cryptographix.org>', // sender address
      to: 'sean.wykes@nascent.com.br', // list of receivers
      subject: 'Livro - Criptografia Essencial', // Subject line
     // text: 'Hello world' + JSON.stringify( info ), // plaintext body
      html: fs.readFileSync( "book-sample-request.pt.html", "utf8" ),
  };

  // send mail with defined transport object
  transporter.sendMail(mailOptions, function( error, info ) {

    if ( error ) {
      console.log(error);

      cb( error );
    } else {
      console.log('Message sent: ' + info.response);

      cb( false );
    }
  });
}

// mount /api
app.post( '/api/subscribe', (req, resp, done) => {
  let info: { name: string, email: string, origin: string, lang: string, type: string } = req.body;

  fs.appendFile('subscribers.txt', JSON.stringify( info )+',\n', function (err) {
    sendMail( "book-sample-request.pt.html", info, (err) => {
      if ( !err ) {
        resp.sendStatus(200);
      } else {
        resp.status(500).json({message: "Unable to send email:", error: err });
      }

      done();
    } )
  });
} );

//
let port = 8400;
app.listen( port, ()=>{
  console.log("Essential Cryptography submit server listening on port %d in %s mode", port, app.settings.env );
} );

export var App = app;
