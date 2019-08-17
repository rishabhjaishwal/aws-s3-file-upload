import {inventoryBucket,uploadingInventoryData,getHospitalData,getInventoryUploadNotification,getUpdatedUploadDate, addInventoryUserCommentInElasticsearch, downloadAsExcel, getInventoryUserComment,getInventoryData} from '../controller/inventory_controller'

export let routes = (express , app) =>{
    const router = express.Router();
    router.post('/uploadDataOnServer',uploadingInventoryData)
    router.post('/getHospitalData',getHospitalData)
    router.post('/getUpdatedUploadDate',getUpdatedUploadDate)
    router.post('/getInventoryUploadNotification',getInventoryUploadNotification)
    app.use('/api/inventory/' , router);
}