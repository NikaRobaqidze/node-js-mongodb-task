/**
 * @func sendRestoreCode
 * @description 'Send restore code and instructions on user email.
 * Render and send a complete HTML message to the email of the user.'
 * @param Email 'Email of the user to send code.' @type String
 * @param Code 'Code of profile restore.' @type String
 * @param req 'Express request'
 * @param res 'Express response'
 */
function sendRestoreCode(Email, Code, req, res) {

    /**
     * This function does not use for this moment.
     * This function was created for presentation purposes.
     * Project with all files will be uploaded to a public repository there is a risk to the public repository and private email security data.
     * For this moment to get the recovery code find it in the database.
    */

    // Rendering HTML for a message of the email.
    res.render(

        'restore.ejs',

        { Code: Code },

        (err, html) => {

            if (err) {

                return res.status(500).json({ htmlRenderErr: true, Msg: "Error at restore code message rendering." });

            } else {

                /* ------------------ Tools to work with ElementInternals. ----------------- */
                const nodemailer = require('nodemailer');
                const emailAuthConfig = req.app.get('emailAuthConfig').restoreCodeMailer;
                const transporter = nodemailer.createTransport(emailAuthConfig);

                const mailOptions = {
                    from: `${process.env.MAILER_LOG} 'Restore profile'`,
                    to: Email,
                    subject: "Restore code for profile.",
                    html: html
                };

                // Send rendered message by email.
                transporter.sendMail(

                    mailOptions, error => {

                        if (error) {

                            return res.status(500).send({ sendError: true, Msg: "Have error at email sending!" });
                        }
                    }
                );
            }
        }
    );
}

/**
 * @func restoreCode
 * @description 'Set pseudo-randomly generated code to the user to reset password and restore access to the profile.
 * Validate the required request query to find users in the database.
 * If the user exists restore code would be set to the user in a database.'
 * @param req 'Express request'
 * @param res 'Express response'
 */
function restoreCode(req, res) {

    const queries = Object.keys(req.query);

    // Checks if any of the request queries include email and phone.
    if (!queries.includes('email') && !queries.includes('phone')) {

        return res.status(400).json({ invalidQuery: true, Msg: "Request did not contain required query" });
    }

    // Find the user in the database. 
    req.app.get("user-db").usersViewer(

        client => {

            // Searching user in an active collection of users Database.
            client.db('users').collection('active').findOne(

                {
                    $or: [
                        { "email": req.query.email || req.query.phone },
                        { "phone": req.query.email || req.query.phone }
                    ]
                },

                { projection: { email: 1, recoverycode: 1 } }
            )
                .then(
                    User => {

                        // Checking search results.
                        if (!User) {

                            return res.status(404).json({ userNotFound: true, Msg: "User not found. Invalid data." });
                        }

                        // Check if the restore code has already been sent.
                        if (User.recoverycode) {

                            return res.status(409).json({ codeSent: true, Msg: "Restore code of this user has already sent." });
                        }

                        // Generate profile restore code to send on user email.
                        const generatePassword = require("password-generator");
                        const Code = generatePassword(5, false, /^([a-zA-Z0-9 ]+)$/).toString();

                        req.app.get("user-db").usersWriter(

                            client => {

                                // const md5 = require('md5');
                                const { ObjectId } = require('mongodb');

                                client.db('users').collection('active').updateOne(

                                    { _id: new ObjectId(User['_id']) },

                                    {
                                        $set: {
                                            recoverycode: Code // md5(Code) // Save hashed code for security purpose.
                                        }
                                    }
                                )
                                    .then(
                                        () => {

                                            // Send code and instructions to user email.
                                            // sendRestoreCode(User.email, Code, req, res);

                                            res.json({ restoreCodeSet: true, Msg: "Restore code has set." })
                                        }
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
                        res.status(500).json({ errorAtFind: true, Msg: "Error at user restore code sending." });
                    }
                );
        }
    );
}
module.exports = restoreCode;