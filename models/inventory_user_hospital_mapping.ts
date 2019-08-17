var Sequelize = require("sequelize");
module.exports = function (sequelize, DataTypes) {

    var inventory_user_hospital_mapping = sequelize.define("inventory_user_hospital_mapping", {
        userId: DataTypes.STRING(500),
        hospitalId:DataTypes.BIGINT(11),
        month: DataTypes.INTEGER,
        year: DataTypes.INTEGER,
        fileUploadId:{type:DataTypes.INTEGER,
            unique: true,
            allowNull: false
        }
    });

    inventory_user_hospital_mapping.associate = models => {
        inventory_user_hospital_mapping.belongsTo(models.inventory_user_file, { targetKey: 'id', foreignKey: 'fileUploadId'});
    };

    return inventory_user_hospital_mapping;
};
