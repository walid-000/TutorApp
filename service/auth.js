const jwt = require("jsonwebtoken")
function getUser(token){
    const user = jwt.verify(token , "thisIsMySecretKey");
    return user ;
}


module.exports = {getUser}