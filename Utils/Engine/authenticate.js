/**
 * @func Authenticate
 * @description 'Checking required keys (EmailOrPhone and Password) of request body to find the user in the database.
 * Searching users in the database by (email or phone) and password.
 * If the user exists set authorization data to session.'
 * @param req 'Express request'
 * @param res 'Express response'
 */
function Authenticate(req, res) {

    const requestValidator = require('../Security/requestValidator');

    requestValidator(

        ['EmailOrPhone', 'Password'], req.query,

        isValid => {

            // Checking required keys.
            if (!isValid) {

                return res.status(400).json({ invalidKeys: true, Msg: "Request did not contain required keys." });
            }

            // Searching user in a database. 
            req.app.get("user-db").usersViewer(

                client => {

                    // Hash tools.
                    const md5 = require('md5');

                    // Find the user in the active collection of users Database.
                    client.db('users').collection('active').findOne(

                        {
                            $and: [
                                {
                                    $or: [
                                        { "email": req.query.EmailOrPhone },
                                        { "phone": req.query.EmailOrPhone }
                                    ]
                                },
                                { "password": md5(req.query.Password) }
                            ]
                        },

                        { projection: { _id: 1, fullname: 1, recoverycode: 1 } }
                    )
                        .then(

                            User => {

                                // Checking search results.
                                if (!User) {

                                    return res.status(404).json({ userNotFound: true, Msg: "User not found. Invalid data." });
                                }

                                // Check if the restore code has been set.
                                if (User.recoverycode) {

                                    // Update user.
                                    req.app.get("user-db").usersWriter(

                                        client => {

                                            const { ObjectId } = require('mongodb');

                                            // Unset the restore code of the user.
                                            client.db('users').collection('active').updateOne(

                                                { _id: new ObjectId(User['_id']) },

                                                { $unset: { recoverycode: "" } }
                                            )
                                        }
                                    );
                                }

                                /* ------------------- Set authorization data to session. ------------------- */

                                req['User'] = User;

                                const DataCryption = require('../Security/DataCryption');
                                const dataCryption = new DataCryption(User['_id']); // Initialize data cryption tool.

                                req.headers['Authorization'] = dataCryption.encrypt();
                                res.cookie(`userSessionID`, dataCryption.encrypt());

                                // Returns a JSON response.
                                res.json({ success: true, AuthorizationHeaderKey: dataCryption.encrypt() });

                            }
                        )
                        .catch(
                            err => {

                                console.error("Error at database connection:", err);
                                res.status(500).json({ errorAtFind: true, Msg: "Error at user login." });
                            }
                        );
                }
            );
        }
    );
}
module.exports = Authenticate;