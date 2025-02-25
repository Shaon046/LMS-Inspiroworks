import { LightningElement, track } from 'lwc';
import LmsLogo from '@salesforce/resourceUrl/LmsLogo';
import fetchConfigurationStyles from '@salesforce/apex/LMSCoursesTabController.fetchAvailableCoursesWithFiles';
import getUserDetailsWithThereRole from '@salesforce/apex/LMSDashboardController.getUserDetailsWithThereRole';


export default class LmsCommunityHeader extends LightningElement {
    LmsLogo = LmsLogo;

    @track communityHeaderStyle;
    @track imageUrlsConfigurational = [];
    @track fileImageUrls = []; // To store constructed image URLs

    connectedCallback() {
        this.fetchStyles();
        this.fetchUserDetails();
    }

    fetchStyles() {
        fetchConfigurationStyles()
            .then((data) => {
                if (data) {
                    this.lmsConfigurations = data.map(item => item.lmsConfiguration);
                    this.communityHeaderStyle = `background-color : ${this.lmsConfigurations[0]?.Header_Display_Stylling__c}` || 'background: #add6e4;';
                    this.imageUrlsConfigurational = data[0]?.lmsConfigFiles || [];
                    console.log(`background: ${this.communityHeaderStyle}`);
                    this.fileImageUrls = this.imageUrlsConfigurational.map(file => 
                        `/sfc/servlet.shepherd/version/renditionDownload?rendition=THUMB720BY480&versionId=${file.LatestPublishedVersionId}`
                    );
                    console.log('Constructed File Image URLs:', JSON.stringify(this.fileImageUrls));
                }
            })
            .catch((error) => {
                console.error('Error fetching styles:', error);
            });
    }

      fetchUserDetails() {
        getUserDetailsWithThereRole()
            .then((data) => {
                if (data) {
                   this.username = data;
                }
            })
            .catch((error) => {
                console.error('Error fetching styles:', error);
            });
    }



    get computedHeaderStyle() {
        return this.communityHeaderStyle || 'background: #add6e4;';
    }
}