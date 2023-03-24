/**
 * @class DataCryption
 * @description 'Manager of data encrypting.'
 */
class DataCryption {

    constructor(content) {

        this.Cryptr = require('cryptr');
        this.cryptr = new this.Cryptr('$6aCe-e|27e#11@37');

        this.content = content;
    }

    encrypt() {

        return this.cryptr.encrypt(this.content);
    }

    decrypt() {

        return this.cryptr.decrypt(this.content);
    }
}
module.exports = DataCryption;