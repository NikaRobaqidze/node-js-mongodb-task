/**
 * @func signUp
 * @description 'Sign up user.
 * Validate, check and insert data into the database.
 * Validate required request body keys.
 * Check entered information in the database to escape users with the same authorization data.
 * Final insert entered data into the database.'
 * @param req 'Express request'
 * @param res 'Express response'
 */
function signUp(req, res) {

    const requestValidator = require('../Security/requestValidator');
    const requiredRequestBodyKeys = [
        'fullname',
        'email',
        'phone',
        'password'
    ];

    // Validate required body keys.
    requestValidator(

        requiredRequestBodyKeys,

        req.body,

        isValid => {

            // Checking required keys.
            if (!isValid) {

                return res.status(400).json({ invalidKeys: true, Msg: "Request did not contain required keys." })
            }

            // Check request body keys to escape injection.
            for (const key of Object.keys(req.body)) {

                if (!requiredRequestBodyKeys.includes(key)) {

                    // Delete key that is not allowed.
                    delete req.body[key];
                }
            }

            // Find the user in MongoDB.
            req.app.get("user-db").usersViewer(

                client => {

                    // Searching user in an active collection of users Database.
                    client.db('users').collection('active').findOne(

                        {
                            $or: [
                                { email: req.body.email },
                                { phone: req.body.phone }
                            ]
                        }
                    )
                        .then(User => {

                            // Checking search results.
                            if (User) {

                                return res.status(409).json({ userNotFound: true, Msg: "User with same data have already signed." });
                            }

                            // Hash tools.
                            const md5 = require('md5');
                            req.body.password = md5(req.body.password);

                            // Insert user to database
                            req.app.get("user-db").usersWriter(

                                client => {

                                    // Insert user data in an active collection of user s Database.
                                    client.db('users').collection('active').insertOne(req.body)
                                        .then(
                                            result => {

                                                const DataCryption = require('../Security/DataCryption');
                                                const dataCryption = new DataCryption(result.insertedId); // Initialize data cryption tool.

                                                res.json({ signed: true, AuthorizationHeaderKey: dataCryption.encrypt() });
                                            }
                                        )
                                        .catch(
                                            err => {

                                                console.error("Error at user data inserting:", err);
                                                res.status(500).json({ insertError: true, Msg: "Error at user signing." });
                                            }
                                        );
                                }
                            );
                        })
                        .catch(
                            err => {

                                console.error("Error with database at user sign data check:", err);
                                res.status(500).json({ errorAtFind: true, Msg: "Error at user sign check." });
                            }
                        );
                }
            );
        }
    );
}
module.exports = signUp;