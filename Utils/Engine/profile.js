/**
 * @func profile
 * @description 'Render a user profile.
 * Searching user by _id saved in a session.'
 * @param req 'Express request'
 * @param res 'Express response'
 */
function profile(req, res) {

    // Find user by _id in database.
    req.app.get("user-db").usersViewer(

        client => {

            const { ObjectId } = require('mongodb');

            // Searching user in the active collection of users Database.
            client.db('users').collection('active').findOne(

                { _id: new ObjectId(req.User['_id']) },

                { projection: { _id: 1, fullname: 1, email: 1, phone: 1 } }
            )
                .then(User => res.json(User))
                .catch(
                    err => {

                        console.error("Error with database at rendering user data:", err);
                        res.status(500).json({ errorAtFind: true, Msg: "Error at user data render." });
                    }
                );
        }
    );
}
module.exports = profile;