# node-js-mongodb-task
Task from sweeft digital. Personal finances backend (REST API) app. Project powered by Node.js (Express), Database MongoDB. 
Project ready to make http request. Rest api supported. To make authorized request required to add 'Authorization' key in header of request.
To get value of 'Authorization' key, make POST '/sign-up' request. You will get value in JSON response. 

## Installation
Create directory and clone files from reposiroty:

```bash
mkdir project && cd project
git clone https://github.com/NikaRobaqidze/node-js-mongodb-task.git .
```

After cloning of file and run [npm](https://nodejs.org/en/download) to install all packages:

```bash
npm install
```

Now to run application create next admins of MongoDB. In this example we will use [mongosh](https://www.mongodb.com/docs/manual/installation/) console. Open mogosh console:

```bash
db.createUser({ user: "SystemAdministration", pwd: "40db9$3_42+7|d124" roles: [ { role: 'dbAdmin', db: 'test' }, { role: 'dbAdmin', db: 'admin' }, { role: 'dbAdmin', db: 'users' }, { role: 'dbAdmin', db: 'transactions' }]})
```

Create admins for users database:

```bash
use users
```

Create users viewer admin:

```bash
db.createUser({ user: "user_viewer", pwd: "f4D6de1.32-868" roles: [ { role: 'read', db: 'users' } ]})
```

Create users editor admin:

```bash
db.createUser({ user: "user_editor", pwd: "9e7-968bf01fa5" roles: [ { role: 'readWrite', db: 'users' } ]})
```

Now create users for transactions:

```bash
use transactions
```

Create transactions viwer admin:

```bash
db.createUser({ user: "transaction_viewer", pwd: "82f-55c^87f6Sce" roles: [ { role: 'read', db: 'transactions' } ]})
```

Create transactions editor admin:

```bash
db.createUser({ user: "user_editor", pwd: "9c34^37Be17^c14" roles: [ { role: 'readWrite', db: 'transactions' } ]})
```

At the end run script of project to create databases and collections:
Before this step run make sure that MongoDB is run.

```bash
npm run create-dbs
```

As result you must get two message to terminal:
```bash
'users' database and 'active' collection created.
'transactions' database and 'transaction' collection created.
```

## Run application

To run project to make https request run next command:

```bash
npm run app
```

As result you must get this text at the bottom:

```bash
...
Application ready to work.
```

Congratulation! Project is ready to test.
