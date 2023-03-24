/**
 * @func createNewCategory
 * @description 'Create new personal finances categories of an authorized user.
 * Validate required request body keys.
 * Check if a new category already exists.
 * Insert new category name to user categories list.'
 * @param req 'Express request'
 * @param res 'Express response'
 */
function createNewCategory(req, res) {

    const requestValidator = require('../Security/requestValidator');

    // Validate required body keys.
    requestValidator(

        ['Name'], req.body,

        isValid => {

            // Checking required keys.
            if (!isValid) {

                return res.status(400).json({ invalidKeys: true, Msg: "Request did not contain required keys." });
            }

            // Check category name.
            if (req.body.Name.trim() == 'default') {

                return res.status(400).json({ invalidName: true, Msg: "Name of category 'default' is not allowed." });
            }

            // Find a category of the user.
            req.app.get("user-db").usersViewer(

                client => {

                    const { ObjectId } = require('mongodb');

                    // Find user categories in an active collection of user s Database.
                    client.db('users').collection('active').findOne(

                        {
                            $and: [
                                { _id: new ObjectId(req.User['_id']) },
                                { "categories.Name": req.body.Name.trim() }
                            ]
                        },

                        { projection: { categories: 1 } }
                    )
                        .then(
                            Categories => {

                                // Check search results.
                                if (Categories) {

                                    return res.status(409).json({ categoryExist: true, Msg: "Category have already exist." });
                                }

                                // Update user.
                                req.app.get("user-db").usersWriter(

                                    client => {

                                        // Update user category.
                                        client.db('users').collection('active').updateOne(

                                            { _id: new ObjectId(req.User['_id']) },

                                            {
                                                $push: {
                                                    "categories": {
                                                        "category_id": Math.random().toString(16).slice(2), // Handly generate id of category.
                                                        "Name": req.body.Name.trim()
                                                    }
                                                }
                                            }
                                        )
                                            .then(() => res.json({ created: true, Msg: "New category created." }))
                                            .catch(
                                                err => {

                                                    console.error("Error at database connection:", err);
                                                    res.status(500).json({ errorAtFind: true, Msg: "Error at creating of user category." });
                                                }
                                            );
                                    }
                                );
                            }
                        )
                        .catch(
                            err => {

                                console.error("Error with database at user categories selecting:", err);
                                res.status(500).json({ errorAtFind: true, Msg: "Error at user categories check." });
                            }
                        );
                }
            );
        }
    );
}
module.exports = createNewCategory;