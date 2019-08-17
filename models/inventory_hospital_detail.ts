var Sequelize = require("sequelize");
module.exports = function (sequelize, DataTypes) {

    var inventory_hospital_detail = sequelize.define("inventory_hospital_detail", {
        hospitalName: DataTypes.STRING(500),
        hospitalId: DataTypes.STRING(500),
        userId: DataTypes.STRING(500)
    });
    return inventory_hospital_detail;
};
