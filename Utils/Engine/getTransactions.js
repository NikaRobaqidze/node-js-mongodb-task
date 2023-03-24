/**
 * @func setCategoryNames
 * @description 'Change category IDs on names in transactions object.
 * Find category name by id and replace it by name.'
 * @param categories 'List of categories from MongoDB' @type Array
 * @param transactions 'List of transactions from MongoDB' @type Array
 */
function setCategoryNames(categories, transactions) {

    // Go through all transactions
    for (const transaction of transactions) {

        // Reset list of category ids by list of category names.
        transaction.category = transaction.category.map(

            category_id => {

                const searchedCategory = categories.find(
                    category => {

                        return category.category_id == category_id;
                    }
                );

                return searchedCategory ? searchedCategory.Name : category_id;
            }
        );
    }
}


/**
 * @func getTransactions
 * @description 'Get all JSON list of transactions of user.
 * Validate required request queris.
 * Use queries to sort and search specific transaction.'
 * @param req 'Express request'
 * @param res 'Express response'
 */
function getTransactions(req, res) {

    const { ObjectId, Timestamp } = require('mongodb');

    // List of allowed filter keys.
    const allowedFilterKeys = ["type", "date", "price", "status", "sortBy"];

    // List of allowed sort keys.
    const allowedSortKeys = ["date", "price"];

    // Conditions of transaction searching.
    const findConditions = [];

    // Key for sorting.
    const sortObject = {};

    // Check request body keys to escape injection.
    for (const key of Object.keys(req.query)) {

        // Set sort key.
        if (key == 'sortBy') {

            // Validate sort keys.
            for (const sortKey of req.query[key].split(',')) {

                if (allowedSortKeys.includes(sortKey)) {

                    // Allow sort by this key.
                    sortObject[sortKey] = 1;
                }
            }

            delete req.query[key];
            continue;
        }

        // Check request body key
        if (!allowedFilterKeys.includes(key)) {

            // Delete key that is not allowed.
            delete req.query[key];
            continue;
        }

        // Validate price.
        if (key == "price") {

            // Parse to number.
            req.query[key] = parseFloat(req.query[key]);
        }

        // Validate date.
        if (key == "date") {

            // Parse to allow by MongoDB format.
            req.query[key] = new Timestamp(new Date(req.query[key]) * 1);
        }

        const condition = {};
        condition[key] = req.query[key];

        // Create complete conditions.
        findConditions.push(condition);
    }

    // Find the category of the user.
    req.app.get("user-db").usersViewer(

        client => {

            // Find user categories in an active collection of user s Database.
            client.db('users').collection('active').findOne(

                { _id: new ObjectId(req.User['_id']) },

                { projection: { _id: 0, categories: 1 } }
            )
                .then(
                    Categories => {

                        // Searching conditions + logic.
                        const complexCondition = {};

                        // Check conditions count to set logic.
                        if (findConditions.length > 0) {

                            // Set condotion logic.
                            complexCondition['$or'] = findConditions
                        }

                        // Find transactions of user in Database.
                        req.app.get("user-db").transactionsViewer(

                            transaction => {

                                // Find transaction data in a transaction collection of transactions Database by user id.
                                transaction.db('transactions').collection('transaction').find(

                                    {
                                        $and: [
                                            { "user_id": req.User['_id'].toString() },
                                            complexCondition
                                        ]
                                    }

                                )
                                    // Sort transactions
                                    .sort(allowedSortKeys)

                                    // Convert to array.
                                    .toArray()
                                    .then(
                                        Transactions => {

                                            // Replace category IDs by name.
                                            setCategoryNames(Categories.categories, Transactions);

                                            res.json(Transactions);
                                        }
                                    )
                                    .catch(
                                        err => {

                                            console.error("Error at transaction selecting:", err);
                                            res.status(500).json({ insertError: true, Msg: "Error at transaction rendering." });
                                        }
                                    )
                            }
                        );
                    }
                )

                .catch(
                    err => {

                        console.error("Error with database at user categories selecting:", err);
                        res.status(500).json({ errorAtFind: true, Msg: "Error at user categories selecting." });
                    }
                );
        }
    );
}
module.exports = getTransactions;