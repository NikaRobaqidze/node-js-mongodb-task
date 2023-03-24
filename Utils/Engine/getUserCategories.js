/**
 * @func getUserCategories
 * @description 'Render JSON list user personal finances categories of the authorized user.'
 * @param req 'Express request'
 * @param res 'Express response'
 */
function getUserCategories(req, res) {

    // Find the category of the user.
    req.app.get("user-db").usersViewer(

        client => {

            const { ObjectId } = require('mongodb');

            // Find user categories in an active collection of user s Database.
            client.db('users').collection('active').findOne(

                { _id: new ObjectId(req.User['_id']) },

                { projection: { _id: 0, categories: 1 } }
            )
                .then(Categories => res.json(Categories))

                .catch(
                    err => {

                        console.error("Error with database at user categories selecting:", err);
                        res.status(500).json({ errorAtFind: true, Msg: "Error at user categories render." });
                    }
                );
        }
    );
}
module.exports = getUserCategories;