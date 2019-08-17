
import { Request, Response } from 'express';
const async = require('async')
import {successResponseHandler , errorResponseHandler} from "../utils/response_handler"
import invetoryCommentService from '../service/inventory_comment_services'
var Sequelize = require("sequelize");
import { resolve } from 'path';

import { createReadStream, createWriteStream } from 'fs';
const AWS = require('aws-sdk');
var s3 = require('@auth0/s3');
const formidable = require("formidable");
const fs = require('fs');
const fse = require('fs-extra')
import Server from '../server';
const serverconfig = Server.getInstance();



function S3Connection() {
    var client = s3.createClient({
        maxAsyncS3: 20,     // this is the default
        s3RetryCount: 3,    // this is the default
        s3RetryDelay: 1000, // this is the default
        multipartUploadThreshold: 20971520, // this is the default (20 MB)
        multipartUploadSize: 15728640, // this is the default (15 MB)
        s3Options: {
          accessKeyId:'<ID>',
          secretAccessKey: '<KEY>',
          signatureVersion: 'v4',
           region: 'us-east-1',
          endpoint: 's3.us-east-1.amazonaws.com',
          },
      });
      return client;
}


function S3Parameter(OriginalFileWithPath,BucketName,RenamedFileWithPath) {
    var params = {
        localFile: OriginalFileWithPath,
        s3Params: {
          Bucket: BucketName,
          Key: RenamedFileWithPath,
         },
      };
      return params;
}


function inventoryFileDbSave(OriginalFileName,RenamedFileName,Path) {
    return new Promise(function(resolve,reject) {
    var data = {
        'originalFileName':OriginalFileName,
        'renamedFileName':RenamedFileName,
        'path':Path,
    };
    invetoryCommentService.insertInventoryUserFile(data,(error,response)=>{
        if(error)
            reject(error)
        else
         resolve(response);
    })
   })
}

function inventoryFileUserMapping(UserId,RenamedFileName,month,year,fileUploadId) {
    return new Promise(function(resolve,reject) {
    var data = {
        'userId':UserId,
        'hospitalId':RenamedFileName,
        'month':month,
        'year':year,
        'fileUploadId':fileUploadId
    };
    invetoryCommentService.insertUserFileMapping(data,(error,response)=>{
        if(error)
            reject(error);
        else
        resolve(response);
    })
})
}


export let uploadingInventoryData=(req : Request , res : Response)=>{
    new formidable.IncomingForm().parse(req, async (err, fields, files) => {
        try {
        var fileExtention;
    if(files.file !== undefined){
         fileExtention = files.file.name.toString().split('.');
    }else {
        res.send(JSON.stringify({error:"Error occured because of file not Selected",success:''}))
        return;
    }
    let read =await  fs.createReadStream(`${files.file.path}`);
    if(!fs.existsSync(`temp_${fields.user_id}_${fields.year}_${fields.month}`)){
        fs.mkdirSync(`temp_${fields.user_id}_${fields.year}_${fields.month}`,{mode:0o777});
    }
    let count = await countForVersioning({'userId':fields.user_id,
    'hospitalId':fields.hospital_id,
    'month':fields.month,
    'year':fields.year}).catch(err => {
        res.send(JSON.stringify({error:"Error occured while find File Modified Version",success:''}));
        return;
    });
    let hospital = await getHospitalName(fields.hospital_id).catch(err => {
        res.send(JSON.stringify({error:"Error occured while Finding hospitalID",success:''}));
        return;
    })
    let folderName = `temp_${fields.user_id}_${fields.year}_${fields.month}`;
    let fileName = `${fields.user_id}_${hospital}_${count > 0? count : parseInt(count.toString())+1}.${fileExtention[fileExtention.length -1]}`;
    let write =await fs.createWriteStream(`./${folderName}/${fileName}`);
    write.on('pipe',(src)=>{
        console.log("pipeing data");
    })
    write.on('finish',() => {
        fse.remove(files.file.path,err =>{
            if (err) return console.error(err)
            console.log('success!')
        })
     remoteDatabaseUpload(fields,folderName,fileName,files.file.name)
    
    })
    await read.pipe(write);
}catch(error) {
    console.error(error);
    res.send(JSON.stringify({error:"Error occured in getting File at Server",success:''}))
    return;
  }
    });
    


    function remoteDatabaseUpload(data,directoryName,filename,originalFileName){
        var promise = new Promise(function(resolve,reject){
            var client = S3Connection();
            // res.header( 'Content-Type', 'application/octet-stream');
            // res.writeHead(200, {
            //     'Content-Type': 'text/event-stream',
            //     'Cache-Control': 'no-cache',
            //     'Connection': 'keep-alive'
            //   });
            
            var params = S3Parameter(`./${directoryName}/${filename}`,'inventoryfiledata',`Inventory/${data.year}/${data.month}/${filename}`);
            var uploader = client.uploadFile(params);
            uploader.on('error', function(err) {
                console.error("unable to upload:", err.stack);
                reject(err.stack);
            });var percent;
            uploader.on('progress', function() {
                console.log("progress", uploader.progressMd5Amount,
                        uploader.progressAmount, uploader.progressTotal);
                         percent = parseInt(((uploader.progressAmount / uploader.progressTotal ) * 100).toString()).toString();
                         serverconfig.io.to(data.SocketId).emit('listeningprogress', percent,{BroadcastChannel:false});
                    }) 
             

            uploader.on('end', function() {
                console.log("done uploading");
                resolve('Done Uploading')
            });
        });
        promise.then(respo =>{
           return inventoryFileDbSave(originalFileName,filename,`Inventory/${data.year}/${data.month}/`)
        },err => {
              
                res.send( JSON.stringify({error:'error occured while saving file info to Database',success:''}))
                return;
        }).then(respo => {
            return inventoryFileUserMapping(data.user_id,data.hospital_id,data.month,data.year,respo)
        },err => {
            
            res.send(JSON.stringify({error:'error occured while saving file mapping  to Database',success:''}))
            return;
    }).then(respo => {
            fse.removeSync(`temp_${data.user_id}_${data.year}_${data.month}`);
            
        },err => {
            res.send(JSON.stringify({error:'error occured while Deleting temporary file from server',success:''}))
            return;
    }).then(respo =>{
        res.send(JSON.stringify({error:'',success:'Successfully Updated'}));
            return;
    })
        .catch(err =>{
            console.log(err);
            res.send(JSON.stringify({error: 'error occured while Deleting temporary file from server',success:''}));
            return;
        })
    };
}


function  countForVersioning(data){
  return new Promise(function(resolve,reject) {
    invetoryCommentService.getCountForFile({'userId':data.userId,
    'hospitalId':data.hospitalId,
    'month':data.month,
    'year':data.year
    },(error,response)=> {
        if(!error){
            resolve(response.toString())
        }else{
                console.log("error occured...")
                reject('error');
            }
    })
})
}

function getHospitalName(hospitalId) {
    return new Promise(function(resolve,reject) {
    invetoryCommentService.getHospitalName({'id':hospitalId},(error,responseitem) => {
        if(!error) {
            resolve(responseitem)
        }else {
            reject('error')
        }
    })
})
}