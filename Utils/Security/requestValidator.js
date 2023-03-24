/**
 * @func requestValidator
 * @description 'Check if the request has required data.'
 * @param requiredKeyList 'List that contains string name of required name.' @type Array
 * @param objectToValidate 'Object that needs to validate.' @type Object
 * @param callback 'Callback function that takes boolean status. 
 * true - is valid;
 * false - is invalid' @type Function
 */
function requestValidator(requiredKeyList, objectToValidate, callback) {

    const enteredKeys = Object.keys(objectToValidate);

    for (const key of requiredKeyList) {

        if (typeof objectToValidate[key] == 'string' &&
            (!enteredKeys.includes(key) ||
                !objectToValidate[key].replace(/\s/g, '').length)) {

            return callback(false);
        }
    }

    return callback(true);
}
module.exports = requestValidator;