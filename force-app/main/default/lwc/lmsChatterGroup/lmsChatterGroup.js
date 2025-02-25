import { LightningElement, track } from 'lwc';
import getAllCollaborationGroup from '@salesforce/apex/LMSChatterGroupController.getAllCollaborationGroup';
export default class LmsChatterGroup extends LightningElement {
    @track groups = [];
    @track filteredGroups = [];
    @track isOpen = false;
    @track selectedGroupDetails;
    @track isGrpDetailsReady = false;
    @track isRenderedChatBox = false;
    @track chatboxParentId;
    @track chatGroupName;
    searchTerm = '';
    options = {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
    };

    connectedCallback() {
        this.getCollaborationGroupDetail();
    }
    getCollaborationGroupDetail() {

        getAllCollaborationGroup()
            .then(result => {
                console.log('result => ', result);
                console.log('result in chatter9 => ' + JSON.stringify(result));
                this.groups = result;
                this.groups = this.groups.map(wrapper => {
                    const group = wrapper.collaborationGroup;
                    const date = new Date(group.SystemModstamp);
                    const name = group.Owner.Name;
                    let formattedDate = date.toLocaleString('en-GB', this.options);
                    group.SystemModstamp = formattedDate.replace(/\b(am|pm)\b/g, (match) => match.toUpperCase());
                    group.Owner.Name = name.toLowerCase().replace(/\b\w/g, char => char.toUpperCase());


                    if (wrapper.contentVersion) {
                        const iconUrl = `/sfc/servlet.shepherd/version/download/${wrapper.contentVersion}`;
                        group.iconUrl = iconUrl;
                    } else {
                        group.iconUrl = null;
                    }

                    if (wrapper.groupAdminName) {
                        group.groupAdminName = wrapper.groupAdminName.toLowerCase().replace(/\b\w/g, char => char.toUpperCase());
                    } else {
                        group.groupAdminName = null;
                    }

                    if (wrapper.groupDetails) {
                        group.isGroupDetails = true;
                        group.groupDetails = wrapper.groupDetails
                    } else {
                        group.isGroupDetails = false;
                    }

                    return group;
                });
                this.filteredGroups = [...this.groups];
                console.log('result in chatter9 => ' + JSON.stringify(this.groups));
            })
            .catch(error => {
                console.log('error => ' + JSON.stringify(error));
            })
    }

    handleSearch(event) {
        this.searchTerm = event.target.value.toLowerCase();

        if (this.searchTerm) {
            this.filteredGroups = this.groups.filter(group =>
                group.Name.toLowerCase().includes(this.searchTerm)
            );
        } else {
            this.filteredGroups = [...this.groups];
        }
    }

    clearSearchBox() {
        this.searchTerm = '';
        this.filteredGroups = [...this.groups];

        const inputEl = this.template.querySelector('.search-input');
        if (inputEl) {
            inputEl.value = '';
            inputEl.focus();
        }
    }

    toggleModelPopup(event) {
        const groupId = event.currentTarget.dataset.id;
        console.log('Clicked Group ID:', groupId);
        const foundGroup = this.filteredGroups.find(group => group.Id === groupId);

        console.log('Found Group:', foundGroup);

        if (foundGroup) {
            console.log('Members:', foundGroup.groupDetails?.members);
            this.selectedGroupDetails = foundGroup.groupDetails;
            this.isGrpDetailsReady = true;
        } else {
            console.log('No members found');
            this.selectedGroupDetails = [];
            this.isGrpDetailsReady = false;
        }
        this.isOpen = !this.isOpen;
    }

    toggleChatBox(event) {
        const groupId = event.currentTarget.dataset.id;
        this.chatboxParentId = groupId;
        this.chatGroupName = event.currentTarget.dataset.name;
        this.isRenderedChatBox = !this.isRenderedChatBox;
    }

    toggleBackToGroup() {
        this.getCollaborationGroupDetail();
        this.isRenderedChatBox = false;
    }
}