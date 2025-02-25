import { LightningElement, track } from 'lwc';
import getEnrolledCourseDetails from '@salesforce/apex/LMSAllCertificatesController.getEnrolledCourseDetails';
export default class LmsAllCertificates extends LightningElement {
    @track enrolledCourseData;
    pdfLink;
    pdfPreview = false;
    courseRecordId;
    vfPageUrl
    hasCertificate = false;
    courseImage;
    isLoading = true;

    connectedCallback() {
    this.getEnrolledCourseDetails();
    }


    viewPdf(event) {
        //console.log("onClick",event.target.dataset.id);
        this.courseRecordId = event.target.dataset.id
        this.vfPageUrl = `/apex/lmsCourseCompletionCertificate?courseRecordId=${this.courseRecordId}`;
       // console.log("pageURL@@@", this.vfPageUrl)
        this.pdfPreview = true;


    }

   getEnrolledCourseDetails() {
    getEnrolledCourseDetails().then((res) => {
        this.isLoading = false;
        this.enrolledCourseData = this.addImageLink(res); 
        this.hasCertificate = this.enrolledCourseData.length > 0 ? true : false;
       // console.log('edited@@@@@@@@@@', JSON.stringify(this.enrolledCourseData)); 
       // console.log("fn 19", JSON.stringify(res));
    }).catch((err) => {
        console.error(err);
         this.isLoading = false;
    })
}

addImageLink(res) {
    const baseUrl = window.location.origin;
    return res.map((data) => {
        return {
            ...data,  
            courseImage: `${baseUrl}/sfc/servlet.shepherd/version/renditionDownload?rendition=THUMB720BY480&versionId=${data.Document_Version__c}`
        };
    });
}


    back() {
        this.pdfPreview = false;
    }


    downloadPDF() {
        console.log('download clicked')
        // const vfPageUrl = `/apex/lmsCourseCompletionCertificate?courseRecordId=${this.courseRecordId}`;
        // const anchor = document.createElement('a');
        // anchor.href = vfPageUrl;
        // anchor.download = `${courseName}-Completion-Certificate.pdf`;
        // document.body.appendChild(anchor);
        // anchor.click();
        // document.body.removeChild(anchor);
    }


    hideHeaderButton(event) {
        const iframe = event.target;
        const iframeDocument = iframe.contentDocument || iframe.contentWindow.document;

        // Check if iframe document is loaded
        if (iframeDocument) {
            const header = iframeDocument.querySelector('header'); // Adjust the selector as needed
            const button = iframeDocument.querySelector('button'); // Adjust the selector for the button

            // Hide the header and button inside the iframe
            if (header) header.style.display = 'none';
            if (button) button.style.display = 'none';
        }
    }




}