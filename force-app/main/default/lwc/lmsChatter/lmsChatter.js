import { LightningElement } from 'lwc';
import getAllCollaborationGroup from '@salesforce/apex/LMSChatterGroupController.getAllCollaborationGroup';
export default class LmsChatter extends LightningElement {

    data = [];
    connectedCallback() {
        getAllCollaborationGroup()
        .then(result=>{
            this.data = result.collaborationGroupList;
            console.log('result => ', result);
            console.log('result in chatter9 => '+JSON.stringify(result));
        })
        .catch(error=>{
            console.log('error => '+JSON.stringify(error));
        })
    }
}