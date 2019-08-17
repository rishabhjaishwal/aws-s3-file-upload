import { Component, OnInit } from '@angular/core';
import { InventoryService } from '../service/inventory'
import { UserService } from "../service/user";
import { Router } from '@angular/router';
import { Angular2Csv } from 'angular2-csv/Angular2-csv';
import { NgxSpinnerService } from 'ngx-spinner';
import { BaseComponent } from "../views/dashboard/base/base.component";
import {FilterServices} from "../service/filter";
import {WidgetService} from "../service/widget";
import * as Cookies from 'es-cookie';
import { NgForm } from '@angular/forms';
import {element} from "protractor";
import {
  FormGroup,
  FormControl,
  Validators,
  FormBuilder
} from "@angular/forms";
import { FileUploader } from "ng2-file-upload";
declare var $: any;
const URL = "/api/inventory/upload";
import * as io from 'socket.io-client';

@Component({
  selector: "app-hospital-inventory",
  templateUrl: "./hospital-inventory.component.html",
  styleUrls: ["./hospital-inventory.component.css"]
})
export class HospitalInventoryComponent implements OnInit {
  constructor(
    private inventoryService: InventoryService,
    private userService: UserService,
    private router: Router,
    private spinnerService: NgxSpinnerService,
    private filterService: FilterServices,
    private widgetService: WidgetService
  ) {
    this.socket = io.connect("http://localhost:8000", {
      transports: ["websocket", "polling"]
    });
  }
  public bulkdataupload;
  public uploader: FileUploader = new FileUploader({
    url: URL
  });
  public socketID = "";
  public hospitalData;
  public fullYear = new Date().getFullYear();
  public updated_Date;
  public socket: SocketIOClient.Socket;
  public successmessage='';
  public errormessage = '';
  public showProgressBar = false;
  ngOnInit() {
    this.checkUser();
    this.createSocketConnection();
    this.bulkdataupload = new FormGroup({
      user_id: new FormControl("12", Validators.required),
      hospital_id: new FormControl("", Validators.required),
      year: new FormControl("", Validators.required),
      month: new FormControl("", Validators.required),
      file: new FormControl(null,Validators.required)
    });
  }

  public createSocketConnection() {
    this.socket.on("connect", () => {
      this.socketID = this.socket.id;
    });
    this.socket.on("disconnect", () => {
      this.socket.close();
    });
    this.socket.emit("progress", { msg: "0" });
    this.socket.on("listeningprogress", (data: any) => {
      if ( this.progress === '1' ) {
        this.showProgressBar = true;
      }
      document.getElementById("progressbar").style.width = data + "%";
      this.progress = data;
      if(this.progress === '100'){
        this.successmessage ="Successfully Uploaded";
      }
      this.socket.emit("progress", { msg: data.msg });
    });
  }

  private getUserRegion(next){
      this.userRegion = "us";
      next()
  }

  public checkUser() {
    this.userService.getDetail().subscribe(posts => {
      if (posts.error === false) {
        this.userDetails = posts["response"];
        // checking selected region
        this.userRegion = Cookies.get("selectedRegion");
       
      }
    });
  }
  public userDetails = {};
  public userRegion = "";
 



  public onSubmitUploadingData(data) {
    let finalFormData = new FormData();
    if(this.uploader.queue.length < 1){
      alert("Select a file before clicking button upload");
      return;
    }
      let fileItem = this.uploader.queue[this.uploader.queue.length -1]._file;
      if (fileItem.size > 10000000) {
        alert("Each File should be less than 10 MB of size.");
        return;
      }
      this.showProgressBar =true;
      let data1 = new FormData();
      this.bulkdataupload.file = fileItem;
      this.bulkdataupload.user_id = data.user_id;
      this.bulkdataupload.hospital_id = data.hospital_id;
      this.bulkdataupload.year = data.year;
      this.bulkdataupload.month = data.month;
      finalFormData.append("file", this.bulkdataupload.file);
      finalFormData.append("user_id", this.userDetails['id']);
      finalFormData.append("hospital_id", this.bulkdataupload.hospital_id);
      finalFormData.append("year", this.bulkdataupload.year);
      finalFormData.append("month", this.bulkdataupload.month);
      finalFormData.append("SocketId", this.socketID);
    // }
    console.log("finalformdata", finalFormData);
    this.inventoryService.uploadFiles(finalFormData).subscribe(
      res => {
        // console.log("res", res);
        this.errormessage = res.error;
      },
      err => {
        console.log("err", err);
        this.errormessage ='Error Occured';
      }
    );
  }


}
