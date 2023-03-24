/**
 * @func restoreProfile
 * @description 'Update user password and restore data.
 * Validate request body keys.
 * Find the user in user in the database by (email or phone) and restore the code.
 * If the user has found compare (hashed) the old and password.
 * Update password and unset restore code if the old and new password does not match.'
 * @param req 'Express request'
 * @param res 'Express response'
 */
function restoreProfile(req, res) {

    const requestValidator = require('../Security/requestValidator');

    // Validate required body keys.
    requestValidator(

        ['log', 'restoreCode', 'newPassword'],

        req.body,

        isValid => {

            // Checking required keys.
            if (!isValid) {

                return res.status(400).json({ invalidKeys: true, Msg: "Request did not contain required keys." })
            }

            // Find user in the database. 
            req.app.get("user-db").usersViewer(

                client => {

                    const md5 = require('md5');

                    // Searching user in an active collection of users Database.
                    client.db('users').collection('active').findOne(

                        {
                            $and: [
                                {
                                    $or: [
                                        { "email": req.body.log },
                                        { "phone": req.body.log }
                                    ]
                                },
                                {
                                    "recoverycode": req.body.restoreCode // md5(req.body.restoreCode) 
                                }
                            ]
                        },

                        { projection: { _id: 1, recoverycode: 1, password: 1 } }
                    )
                        .then(
                            User => {

                                // Checking search results.
                                if (!User) {

                                    return res.status(404).json({ userNotFound: true, Msg: "User not found. Invalid data." });
                                }

                                // Hash tools.
                                const newPassword = md5(req.body.newPassword);

                                // Compare old and password.
                                if (User.password == newPassword) {

                                    return res.status(409).json({ samePassword: true, Msg: "Old and new password must not match." });
                                }

                                // Update user.
                                req.app.get("user-db").usersWriter(

                                    client => {

                                        const { ObjectId } = require('mongodb');

                                        // Update user password and unset restore code.
                                        client.db('users').collection('active').updateOne(

                                            { _id: new ObjectId(User['_id']) },

                                            {
                                                $unset: { recoverycode: "" },
                                                $set: { password: newPassword }
                                            }
                                        )
                                            .then(
                                                () => res.json({ newPasswordBeSet: true, Msg: "New password of profile has been set." })
                                            )
                                            .catch(
                                                err => {

                                                    console.error("Error at database connection:", err);
                                                    res.status(500).json({ errorAtFind: true, Msg: "Error at user updating." });
                                                }
                                            );
                                    }
                                );
                            }
                        )
                        .catch(
                            err => {

                                console.error("Error at database connection:", err);
                                res.status(500).json({ errorAtFind: true, Msg: "Error at user finding." });
                            }
                        );
                }
            );
        }
    );
}
module.exports = restoreProfile;