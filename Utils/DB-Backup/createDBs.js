//Configuring environment variables.
require('dotenv').config();
const { MongoClient, ServerApiVersion } = require("mongodb");

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(process.env.DATABASE_VIEWER,
    {
        serverApi: {
            version: ServerApiVersion.v1,
            strict: true,
            deprecationErrors: true,
        }
    }
);

Promise.all(
    [
        client.connect(), // Connect to MongoDB.

        client.db('users').createCollection(
            "active",

            {
                validator: {
                    $jsonSchema: {
                        bsonType: 'object',
                        required: ['fullname', 'email', 'phone', 'password'],
                        properties: {
                            fullname: {
                                bsonType: 'string',
                                description: 'Signed user fullname.'
                            },
                            email: {
                                bsonType: 'string',
                                description: 'Signed user email.',
                            },
                            phone: {
                                bsonType: 'string',
                                description: 'Signed user phone.'
                            },
                            recoverycode: {
                                bsonType: 'string',
                                description: 'Hashed code to restore user profile.'
                            },
                            password: {
                                bsonType: 'string',
                                description: 'Signed user password for login.'
                            },
                            categories: {
                                bsonType: ["array"],
                                uniqueItems: true,
                                additionalProperties: false,
                                items: {
                                    bsonType: ["object"],
                                    required: ["category_id", "Name"],
                                    description: "Unique category names.",
                                    properties: {
                                        category_id: {
                                            bsonType: "string",
                                            description: "Specific (handle) id of category."
                                        },
                                        Name: {
                                            bsonType: "string",
                                            description: "Name of category."
                                        }
                                    }
                                }
                            },
                        }
                    }
                }
            }
        )
            .then(() => console.log("'users' database and 'active' collection created."))
            .catch(err => console.error("Error at 'users' database creating:", err)),

        client.db('transactions').createCollection(
            "transaction",

            {
                validator: {
                    $jsonSchema: {
                        bsonType: 'object',
                        required: ["user_id", "category", "type", "description", "price", "currence", "date"],
                        properties: {
                            user_id: {
                                bsonType: "string",
                                description: "_id of user from users db."
                            },
                            category: {
                                bsonType: 'array',
                                uniqueItems: true,
                                additionalProperties: false,
                                items: {
                                    bsonType: "string",
                                    description: "Category items of transaction. List of category _id"
                                }
                            },
                            type: {
                                enum: ["income", "expend"],
                                description: "Type of transaction."
                            },
                            description: {
                                bsonType: "string",
                                description: "Description (name) of transaction."
                            },
                            price: {
                                bsonType: 'double',
                                description: "Count spent at transaction."
                            },
                            currence: {
                                bsonType: "string",
                                description: "Currence of transaction."
                            },
                            status: {
                                bsonType: "string",
                                description: "Status of transaction."
                            },
                            date: {
                                bsonType: "timestamp",
                                description: "Transaction date."
                            }
                        }
                    }
                }
            }
        )
            .then(() => console.log("'transactions' database and 'transaction' collection created."))
            .catch(err => console.error("Error at 'transaction' database creating:", err))
    ]
)
    // Exit the process.
    .then(() => process.exit(0))
    .catch(
        err => {

            console.error("Error at creating:", err);
            process.exit(1);
        }
    )
    .finally(() => client.close())