/**
 * @func complexResponse
 * @description 'Creates a complex user response.
 * Set user data to session.
 * Send a response with bad status if the user did not authorize.'
 * @param User 'Specific user object found in MongoDB.' @type Object
 * @param req 'Express request'
 * @param res 'Express response'
 * @param next 'Callback to go to next stack in server.'
 */
function complexResponse(User, req, res, next) {

    // Check user search results.
    if(!User){

        // Get a response with HTTP code 403 and a message.
        return res.status(403).json({userNotAuthorized: true, Msg: "User did not authorized."});
    }

    //Set user data to session.
    req['User'] = User;
    next(); // Go to the next stack in the server.
}

/**
 * @func authorization
 * @description 'Perform user authorization.
 * Middleware to check user authorization and get user response.
 * Find the user in MongoDB by decrypted user id saved in cookies.
 * userSessionID cookie key is encrypted user _id.'
 * @param req 'Express request'
 * @param res 'Express response'
 * @param next 'Callback to go to next stack in server.'
 */
function authorization(req, res, next) {

    const cookie = require('cookie');

    // Parse the cookie header if present.
    if ((!req.headers.cookie || !cookie.parse(req.headers.cookie)) && !req.headers.authorization) {

        return complexResponse(false, req, res, next);
    }

    const cookies = cookie.parse(req.headers.cookie || '');

    // Check if the user session ID is not set in the cookie.
    if (!cookies.userSessionID && !req.headers.authorization) {
        
        return complexResponse(false, req, res, next);
    }

    // Find the user in MongoDB.
    else return req.app.get("user-db").usersViewer(

        client => {

            const DataCryption = require('../Security/DataCryption');
            const dataCryption = new DataCryption(cookies.userSessionID || req.headers.authorization); // Initialize data cryption tool.

            const { ObjectId } = require('mongodb');

            // Searching user in the active collection of users Database.
            client.db('users').collection('active').findOne(

                { _id: new ObjectId(dataCryption.decrypt()) },

                { projection: { _id: 1, fullname: 1 } }
            )
                .then(data => complexResponse(data, req, res, next))
                .catch(err => {

                    console.error("Error with database at user authorization check:", err);
                    res.status(500).json({ errorAtFind: true, Msg: "Error at user authorization." });
                });
        }
    );
}
module.exports = authorization;