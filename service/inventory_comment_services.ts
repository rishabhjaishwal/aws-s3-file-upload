import { userInfo } from "os";

var models = require("../models");
var Sequelize = require("sequelize");
var userModel = models.user;
var inventoryComment = models.inventory_comment;
var inventoryUserFileMapping = models.inventory_user_hospital_mapping;
var inventoryFile = models.inventory_user_file;
var hospitalDetails = models.inventory_hospital_detail;
var env       = process.env.NODE_ENV || 'development'
let config = require(__dirname+'/../../server/config/config.json');
var sequelize = new Sequelize(config[env].database, config[env].username, config[env].password, config[env]);

class InventoryComment {

    constructor(){}

    //@ getting the user comment 
    public getUserComment = (key ,next)=>{
      let query = "select DATE_FORMAT(i.createdAt, '%b %d %Y %T') as createdAt, i.comment , u.image , u.name , u.email, i.userId from inventory_comments as i  inner join users as u  on u.id=i.userId where i.key='" + key+"' order by createdAt Desc";
      sequelize.query(query).spread((res, metadata) => {
        // Results will be an empty array and metadata will contain the number of affected rows.
        if(res != null){
            next(res);
        }else{
            next("key does not exist");
        }
    })
    }

    //@ adding the data in inventory_comment table 
    public addUserComment = (  data_version , key , comment , userId, next)=>{
        inventoryComment.build({data_version, key, comment, userId}).save().then((response) =>{
            if(response){
               // console.log("error occure while saving the user comment")
               next(response.dataValues)
            }else{
                next(false);
            }
        })
    }

    public insertUserFileMapping = (data,next) => {
        inventoryUserFileMapping.create(data).then(function (res) {
            if(res){
                next(false, res.get('id'));
            }else{
                next(true, false);
            }
        })
            .catch(function(err) {
                next(true, err);
            }); 
    }

    public insertInventoryUserFile = (data,next) => {
        inventoryFile.create(data).then(function (res) {
            if(res){
                console.log('dataIN')
                next(false, res.get('id'));
            }else{
                console.log('dataOut')
                next(true, false);
            }
        })
            .catch(function(err) {
                next(true, err);
            }); 
    }

    public getCountForFile = (data,next) => {
        inventoryUserFileMapping.count({
            where :{
                'userId':data.userId,
                'hospitalId':data.hospitalId,
                'month':data.month,
                'year':data.year
        }}).then(function (res) {
            if(res){
                next(false, res);
            }else{
                next(false, res);
            }
        }).catch(function(err) {
            next(true, err);
        })
    }

    public getHospitalName = (data,next) => {
      if(data.id !== undefined) {
        hospitalDetails.find({where : {
            'id':data.id
        }})
        .then(function (res) {
            if(res){
                next(false, res.get('hospitalId'));
            }else{
                next(true, res);
            }
        }).catch(function(err) {
            next(true, err);
        })
    }else {
        inventoryUserFileMapping.findAll( {
            where: {
                'userId':data.ids
            }
        })
        .then(function (res) {
            if(res){
                next(false, res);
            }else{
                next(true, res);
            }
        }).catch(function(err) {
            next(true, err);
        })

    }
    }

    public getUserMappedHospital = (data,next) => {
        hospitalDetails.findAll({where:{'id':data.id}})
        .then(function (res) {
            if(res){
                next(false, res);
            }else{
                next(false, res);
            }
        }).catch(function(err) {
            next(true, err);
        })
    }

    public getUserHospitalName = (data,next) => {
        hospitalDetails.findAll({where:{'userId':data.userId}})
        .then(function (res) {
            if(res){
                next(false, res);
            }else{
                next(false, res);
            }
        }).catch(function(err) {
            next(true, err);
        })
    }

    public getUpdatedUploadDate = (data,next) => {
        inventoryUserFileMapping.findOne( {where: {
            'userId':data.userId
        },order:[
            ['userId','DESC']
        ]
    }).then(function (res) {
        if(res){
            next(false, res);
        }else{
            next(true, res);
        }
    }).catch(function(err) {
        next(true, err);
    })
    
    }

}

export default new InventoryComment();
