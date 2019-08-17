var Sequelize = require("sequelize");
module.exports = function (sequelize, DataTypes) {

    var inventory_user_file = sequelize.define("inventory_user_file", {
        // fileId: {
        //     type:DataTypes.BIGINT(11),
        //     primaryKey: true
        // },
        originalFileName:DataTypes.STRING(500),
        renamedFileName:DataTypes.STRING(500),
        path:DataTypes.STRING(500),
        // createdAt:DataTypes.DATE,
        // updatedAt: DataTypes.DATE,
    }
    // , {
    //     freezeTableName: true
    // }
    );

    inventory_user_file.associate = models => {
        inventory_user_file.hasOne(models.inventory_user_hospital_mapping, {targetKey: 'id', foreignKey: 'fileUploadId'});
    };

    return inventory_user_file;
};