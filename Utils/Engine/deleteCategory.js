/**
 * @func deleteCategory
 * @description 'Delete category by name.
 * Validate required request body keys.
 * Check if a category with that name exists.
 * Find the ID of the category to update transactions.
 * Set default category transactions that contain only 1 category that needs to delete.
 * Update user personal categories.
 * Delete category from user categories list by category ID.'
 * @param req 'Express, request'
 * @param res 'Express, response'
 */
function deleteCategory(req, res) {

    const requestValidator = require('../Security/requestValidator');

    // Validate required body keys.
    requestValidator(

        ['Name'], req.query,

        isValid => {

            // Checking required keys.
            if (!isValid) {

                return res.status(400).json({ invalidKeys: true, Msg: "Request did not contain required keys." });
            }

            req.app.get("user-db").usersViewer(

                client => {

                    const { ObjectId } = require('mongodb');

                    // Find user categories in an active collection of user s Database.
                    client.db('users').collection('active').findOne(

                        {
                            $and: [
                                { _id: new ObjectId(req.User['_id']) },
                                { "categories.Name": { $in: [req.query.Name.trim()] } }
                            ]
                        },

                        { projection: { _id: 0, categories: 1 } }
                    )
                        .then(
                            Categories => {

                                // Check search results.
                                if (!Categories) {

                                    return res.status(404).json({ categoryNotFound: true, Msg: `Category '${req.query.Name}' not found.` });
                                }

                                const categoryObj = Categories.categories.find(categ => { return categ.Name == req.query.Name.trim() });

                                // Update transactions in Database.
                                req.app.get("user-db").transactionsWriter(

                                    transaction => {

                                        // Initialize unordered bulk operations.
                                        const bulk = transaction.db('transactions').collection('transaction').initializeUnorderedBulkOp();

                                        // Update transactions that contain only one category that needs to delete. 
                                        bulk.find(

                                            {
                                                $and: [
                                                    { "user_id": req.User['_id'].toString() },
                                                    { "category": { $size: 1 } },
                                                    { "category": { $in: [categoryObj.category_id] } }
                                                ]
                                            }
                                        )
                                            // Set default categories.
                                            .update({ $set: { "category": ["default"] } })

                                        // Update transactions that contain more then one category. 
                                        bulk.find(

                                            {
                                                $and: [
                                                    { "user_id": req.User['_id'].toString() },
                                                    { $expr: { $gt: [{ $size: "$category" }, 1] } },
                                                    { "category": { $in: [categoryObj.category_id] } }
                                                ]
                                            }
                                        )
                                            // Pull category that needs to delete.
                                            .update(
                                                {
                                                    $pull: { "category": { $in: [categoryObj.category_id] } }
                                                }
                                            )

                                        // Executes bulk request to MongoDB.
                                        bulk.execute()
                                            .catch(
                                                err => {

                                                    console.error("Error at transactions update:", err);
                                                    res.status(500).json({ errorAtUpdate: true, Msg: "Error at user transactions update." });
                                                }
                                            );
                                    }
                                );

                                // Update user categories.
                                req.app.get("user-db").usersWriter(

                                    client => {

                                        // Update user category.
                                        client.db('users').collection('active').updateOne(

                                            { _id: new ObjectId(req.User['_id']) },

                                            { $pull: { "categories": { "category_id": categoryObj.category_id } } }
                                        )
                                            .then(() => res.json({ deleted: true, Msg: "Category deleted." }))
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
module.exports = deleteCategory;