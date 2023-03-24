/**
 * @func editCategory
 * @description 'Edit category names.
 * Validate required request body keys.
 * Check if category name that need to change is exist.
 * Check if new category name already exist.
 * Update category by old name.'
 * @param req 'Express request'
 * @param res 'Express response'
 */
function editCategory(req, res) {

    const requestValidator = require('../Security/requestValidator');

    // Validate required body keys.
    requestValidator(

        ['oldName', 'newName'],

        req.body,

        isValid => {

            // Checking required keys.
            if (!isValid) {

                return res.status(400).json({ invalidKeys: true, Msg: "Request did not contain required keys." });
            }

            // Find categories of user.
            req.app.get("user-db").usersViewer(

                client => {

                    const { ObjectId } = require('mongodb');

                    // Find user categories in an active collection of users Database.
                    client.db('users').collection('active').findOne(

                        {
                            $and: [
                                { _id: new ObjectId(req.User['_id']) },
                                { "categories.Name": { $in: [req.body.oldName.trim()] } }
                            ]
                        },

                        { projection: { _id: 0, categories: 1 } }
                    )
                        .then(
                            Categories => {

                                // Check search result.
                                if (!Categories) {

                                    return res.status(404).json({ categoryNotFound: true, Msg: `Category '${req.body.oldName}' not found.` });
                                }

                                // Category names.
                                const categoryNames = Categories.categories.map(categ => { return categ.Name });

                                // Check new category name.
                                if (Categories && categoryNames.includes(req.body.newName.trim())) {

                                    return res.status(409).json({ categoryExist: true, Msg: `Category '${req.body.newName}' have already exist.` });
                                }

                                // Update user categories.
                                req.app.get("user-db").usersWriter(

                                    client => {

                                        // Update user category.
                                        client.db('users').collection('active').updateOne(

                                            { _id: new ObjectId(req.User['_id']) },

                                            { $set: { "categories.$[filter].Name": req.body.newName.trim() } },
                                            { "arrayFilters": [{ "filter.Name": req.body.oldName.trim() }] }
                                        )
                                            .then(() => res.json({ updated: true, Msg: "Category updated." }))
                                            .catch(
                                                err => {

                                                    console.error("Error at database connection:", err);
                                                    res.status(500).json({ errorAtFind: true, Msg: "Error at user category updating." });
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
module.exports = editCategory;