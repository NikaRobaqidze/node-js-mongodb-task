/**
 * Major (root) server of the App.
 * Using the express module to run a web server.
*/

//Configuring environment variables.
require('dotenv').config();

const express = require('express');
const app = express();

// Sets the views engine and EJS.
app.set('view-engine', 'ejs');

/* ------------------ Configures the express public files. ------------------ */

app.use('/js', express.static(__dirname + '/js'));
app.use('/css', express.static(__dirname + '/css'));
app.use('/images', express.static(__dirname + '/images'));

/* -------------------------------------------------------------------------- */

// Extend the express URL encoded with the extended URL.
app.use(express.urlencoded({ extended: false }));
app.use(require('express-flash')());

const bodyParser = require('body-parser');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Setting up a session configuration.
const session = require('express-session');
app.use(
    session(
        {
            secret: process.env.SESSION_SECRET,
            resave: true,
            saveUninitialized: true
        }
    )
);

// Setting up the global configuration of the database connection.
app.set(

    "user-db",

    {
        usersViewer: async (callback) => {

            const { MongoClient, ServerApiVersion } = require("mongodb");

            // Create a MongoClient with a MongoClientOptions object to set the Stable API version
            const client = new MongoClient(process.env.USERS_VIEWER,
                {
                    serverApi: {
                        version: ServerApiVersion.v1,
                        strict: true,
                        deprecationErrors: true,
                    }
                }
            );

            Promise.all(
                [
                    client.connect(),
                    callback(client)
                ]
            )
                .catch((err) => console.log("Error at connection!", err));

        },

        usersWriter: async (callback) => {

            const { MongoClient, ServerApiVersion } = require("mongodb");

            // Create a MongoClient with a MongoClientOptions object to set the Stable API version
            const client = new MongoClient(process.env.USER_EDITOR,
                {
                    serverApi: {
                        version: ServerApiVersion.v1,
                        strict: true,
                        deprecationErrors: true,
                    }
                }
            );

            Promise.all(
                [
                    client.connect(),
                    callback(client)
                ]
            )
                .catch((err) => console.log("Error at connection!", err));
        },

        transactionsViewer: async (callback) => {

            const { MongoClient, ServerApiVersion } = require("mongodb");

            // Create a MongoClient with a MongoClientOptions object to set the Stable API version
            const client = new MongoClient(process.env.TRANSACTION_VIEWER,
                {
                    serverApi: {
                        version: ServerApiVersion.v1,
                        strict: true,
                        deprecationErrors: true,
                    }
                }
            );

            Promise.all(
                [
                    client.connect(),
                    callback(client)
                ]
            )
                .catch((err) => console.log("Error at connection!", err));

        },

        transactionsWriter: async (callback) => {

            const { MongoClient, ServerApiVersion } = require("mongodb");

            // Create a MongoClient with a MongoClientOptions object to set the Stable API version
            const client = new MongoClient(process.env.TRANSACTION_EDITOR,
                {
                    serverApi: {
                        version: ServerApiVersion.v1,
                        strict: true,
                        deprecationErrors: true,
                    }
                }
            );

            Promise.all(
                [
                    client.connect(),
                    callback(client)
                ]
            )
                .catch((err) => console.log("Error at connection!", err));
        }
    }
);

// Setting up the global configuration of email authorization.
app.set(

    "emailAuthConfig",

    {
        restoreCodeMailer: {
            host: process.env.PROD_MAIL_HOST,
            port: process.env.PROD_MAIL_PORT,
            secure: true,
            // sendmail: true,
            auth: {
                user: process.env.MAILER_LOG,
                pass: process.env.MAILER_PASSWORD
            }
        }
    }
);

// Sign up user.
app.post('/sign-up', require('./Utils/Engine/signUp'));

// User authorization.
app.get('/authenticate', require('./Utils/Engine/authenticate'));

// Set code reset user password. 
app.get('/restore-code', require('./Utils/Engine/restoreCode'));

// Check code and reset password of user.
app.put('/restore-profile', require('./Utils/Engine/restoreProfile'));

// Check session authorization.
app.use(require('./Utils/Security/authorization'));

// Get user personal data.
app.get('/profile', require('./Utils/Engine/profile'));

// Create new personal category of user.
app.post('/new-category', require('./Utils/Engine/createNewCategory'));

// Update (change name) of category of user.
app.put('/edit-category', require('./Utils/Engine/editCategory'));

// Delete name of category of user.
app.delete('/delete-category', require('./Utils/Engine/deleteCategory'));

// Get JSON list of categories of user.
app.get('/user-categories', require('./Utils/Engine/getUserCategories'));

// Create new transactions of user.
app.post('/new-transaction', require('./Utils/Engine/createNewTransaction'));

// Get transactions of user.
app.get('/transactions', require('./Utils/Engine/getTransactions'));

// Setting up server port.
app.listen(3000, () => console.log("Application ready to work."));