/**
 * @func createNewTransaction
 * @description 'Create new personal transaction of the user.
 * Validate and edit required request body keys.
 * Set some data by default.
 * Select the personal categories of the user to compare with entered categories.'
 * @param req 'Express request'
 * @param res 'Express response'
 */
async function createNewTransaction(req, res) {

    const requestValidator = require('../Security/requestValidator');

    // Validate required body keys.
    requestValidator(

        [
            'type',
            'description',
            'price',
            'currence'
        ],

        req.body,

        isValid => {

            // Check required keys.
            if (!isValid) {

                return res.status(400).json({ invalidKeys: true, Msg: "Request did not contain required keys." });
            }

            // Check transaction type.
            if (!["income", "expend"].includes(req.body.type)) {

                return res.status(400).json({ invalidPriceType: true, Msg: "Allowed 2 type of transaction income or expend." });
            }

            // Check price type.
            if (!isFinite(req.body.price)) {

                return res.status(400).json({ invalidTransactionType: true, Msg: "Price must be a number." });
            }

            // Limit of characters in the description.
            const descriptionCharLimit = 1000;

            // Check a description character length.
            if (req.body.description.length > descriptionCharLimit) {

                return res.status(400).json({ descriptionCharLimit: true, Msg: `Limit of characters in description is ${descriptionCharLimit}.` });
            }

            // Check transaction categories key.
            if (Object.keys(req.body).includes('category') &&
                !Array.isArray(req.body.category)) {

                return res.status(400).json({ invalidKeyType: true, Msg: "Category of transaction must be an array list." });
            }

            /* -------------------- Edit (configuration) entered data. -------------------- */

            req.body['user_id'] = req.User['_id'].toString();
            req.body['price'] = parseFloat(req.body.price);
            req.body['currence'] = req.body.currence.toString().slice(0, 3).toUpperCase();

            const { ObjectId, Timestamp } = require("mongodb");
            req.body['date'] = new Timestamp();

            // Allowed request body keys.
            const allowedKeys = ["user_id", "category", "type", "description", "price", "currence", "status", "date"];

            // Check request body keys to escape injection.
            for (const key of Object.keys(req.body)) {

                if (!allowedKeys.includes(key)) {

                    // Delete key that is not allowed.
                    delete req.body[key];
                }
            }

            // Get user personal finances categories. 
            req.app.get("user-db").usersViewer(

                client => {

                    // Find user categories in an active collection of user s Database.
                    client.db('users').collection('active').findOne(

                        { _id: new ObjectId(req.User['_id']) },

                        { projection: { _id: 0, categories: 1 } }
                    )
                        .then(
                            Categories => {

                                /* ------------------ Compare entered and existing categories. ----------------- */

                                const transactionCategory = [];

                                for (const category of (req.body.category || [])) {

                                    const categoryObj = Categories.categories.find(categ => { return categ.Name == category });

                                    if (!categoryObj) {

                                        return res.status(404).json({ invalidCategory: true, Msg: `Category '${category}' not found.` });
                                    }

                                    transactionCategory.push(categoryObj.category_id.toString());
                                }

                                // Check compare result.
                                if (transactionCategory.length == 0) {

                                    // Add to the default category.
                                    transactionCategory.push('default');
                                }

                                // Set transaction category.
                                req.body['category'] = transactionCategory;

                                // Insert transactions in Database.
                                req.app.get("user-db").transactionsWriter(

                                    transaction => {

                                        // Insert transaction data in a transaction collection of transactions Database.
                                        transaction.db('transactions').collection('transaction').insertOne(req.body)

                                            .then(() => res.json({ created: true, Msg: "Transaction successfully created." }))

                                            .catch(
                                                err => {

                                                    console.error("Error at transaction inserting:", err);
                                                    res.status(500).json({ insertError: true, Msg: "Error at transaction creating." });
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
module.exports = createNewTransaction;