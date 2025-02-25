import { LightningElement, track, wire } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import USER_ID from '@salesforce/user/Id';
import getUserProfileType from '@salesforce/apex/LMSCoursesTabController.getUserProfileType';
import fetchConfigurationStyles from '@salesforce/apex/LMSCoursesTabController.fetchAvailableCoursesWithFiles';

export default class LmsApplicationsTabs extends NavigationMixin(LightningElement) {
    @track activeTab;
    @track activeContent = '';
    @track lmsConfigurations;
    @track dynamicTabsStyle = '';
    @track activeNavCss = '';
    @track tabsLoaded = false;
    @track userProfile = '';

    allTabs = [
        {
            name: 'Dashboard',
            label: 'Dashboard',
            class: 'slds-nav-vertical__action',
            style: '',
            url: '/s/dashboard'
        },
        {
            name: 'Profile',
            label: 'Profile',
            class: 'slds-nav-vertical__action',
            url: '/s/profile'
        },
        {
            name: 'Courses',
            label: 'Courses',
            class: 'slds-nav-vertical__action',
            url: '/s/allcourses',
            isExpanded: false,
            subTabs: [
                { name: 'MyCourse', label: 'My Course', content: 'Your enrolled courses.', class: 'slds-nav-vertical__action', url: '/s/mycourse' },
                { name: 'Quiz', label: 'Quiz', content: 'Your quizzes and assignments.', class: 'slds-nav-vertical__action', url: '/s/quiz' }
            ]
        },
        {
            name: 'Certificates',
            label: 'Certificates',
            class: 'slds-nav-vertical__action',
            url: '/s/certificates'
        },
        {
            name: 'Reports',
            label: 'Reports',
            class: 'slds-nav-vertical__action',
            url: '/s/reports'
        },
        {
            name: 'Survey',
            label: 'Survey',
            class: 'slds-nav-vertical__action',
            url: '/s/survey'
        },
        {
            name: 'FAQs',
            label: 'FAQs',
            class: 'slds-nav-vertical__action',
            url: '/s/faqs'
        },
        {
            name: 'Chatter Group',
            label: 'Chatter Group',
            class: 'slds-nav-vertical__action',
            url: '/s/chatter'
        },
    ];

    @track tabs = [];

    isAdmin = false;
    isLearner = false;

    connectedCallback() {
        getUserProfileType()
            .then((profile) => {
                console.log('Check current user login check @@@@@@', profile.isAdmin, profile.isLearner);
                if (profile.isAdmin) {
                    this.isAdmin = true;
                }
                if (profile.isLearner) {
                    this.isLearner = true;
                }
                this.filterTabsBasedOnProfile();
                this.initializeTabs();
            })
            .catch((error) => {
                console.error('Error fetching user profile:', error);
            });
    }


    filterTabsBasedOnProfile() {
        const adminTabs = ['Dashboard', 'Profile', 'Courses', 'Chatter Group'];
        const learnerTabs = ['Dashboard', 'Profile', 'Courses', 'Certificates', 'Reports', 'Survey', 'FAQs'];

        if (this.isAdmin) {
            this.tabs = this.allTabs.map(tab => {
                if (tab.name === 'Courses') {
                    return { ...tab, subTabs: [] };
                }
                return tab;
            }).filter(tab => adminTabs.includes(tab.name));
        } else if (this.isLearner) {
            this.tabs = this.allTabs.map(tab => {
                if (tab.name === 'Courses') {
                    return {
                        ...tab,
                        subTabs: tab.subTabs.filter(subTab => ['MyCourse', 'Quiz'].includes(subTab.name))
                    };
                }
                return tab;
            }).filter(tab => learnerTabs.includes(tab.name));
        } else {
            this.tabs = [];
        }

        this.tabsLoaded = true;
    }


    initializeTabs() {
        const urlParams = new URL(window.location.href).searchParams;
        const activeTabParam = urlParams.get('activeTab');

        if (activeTabParam) {
            this.activeTab = activeTabParam;

            this.tabs = this.tabs.map(tab => {
                if (tab.subTabs) {
                    const activeSubTab = tab.subTabs.find(subTab => subTab.name === this.activeTab);
                    if (activeSubTab) {
                        return {
                            ...tab,
                            isExpanded: true,
                            subTabs: tab.subTabs.map(subTab => ({
                                ...subTab,
                                class: subTab.name === this.activeTab ? 'slds-nav-vertical__action slds-is-active' : 'slds-nav-vertical__action',
                            })),
                        };
                    }
                }

                return {
                    ...tab,
                    class: tab.name === this.activeTab ? 'slds-nav-vertical__action slds-is-active' : 'slds-nav-vertical__action',
                    isExpanded: tab.name === this.activeTab && tab.subTabs ? true : false,
                };
            });

            const activeTabObj = this.tabs.find(tab => tab.name === this.activeTab);
            this.activeContent = activeTabObj?.content || '';
        }

        if (this.tabsLoaded && this.activeNavCss) {
            this.applyStyles();
        } else {
            this.fetchStyles();
        }
    }

    handleTabClick(event) {
        const tabName = event.target.dataset.name;
        const selectedTab = this.tabs.find(tab => tab.name === tabName);

        if (selectedTab) {
            if (!this.tabsLoaded) {
                this.fetchStyles().then(() => {
                    this.updateTabStyles(tabName);
                });
            } else {
                this.updateTabStyles(tabName);
            }

            this.navigateToUrl(selectedTab.url, tabName);
            this.activeContent = selectedTab.content || '';
        }
    }

    updateTabStyles(tabName) {
        this.tabs = this.tabs.map(tab => ({
            ...tab,
            class: tab.name === tabName ? 'slds-nav-vertical__action slds-is-active' : 'slds-nav-vertical__action',
            style: tab.name === tabName ? this.activeNavCss : ''
        }));
    }

    handleSubTabClick(event) {
        const subTabName = event.target.dataset.name;

        this.tabs = this.tabs.map(tab => {
            if (tab.subTabs) {
                const updatedSubTabs = tab.subTabs.map(subTab => ({
                    ...subTab,
                    class: subTab.name === subTabName ? 'slds-nav-vertical__action slds-is-active' : 'slds-nav-vertical__action',
                }));

                const selectedSubTab = updatedSubTabs.find(subTab => subTab.name === subTabName);
                if (selectedSubTab) {
                    this.navigateToUrl(selectedSubTab.url, subTabName);
                    this.activeContent = selectedSubTab.content || '';
                }

                return {
                    ...tab,
                    subTabs: updatedSubTabs,
                };
            }
            return tab;
        });
    }

    fetchStyles() {
        return fetchConfigurationStyles()
            .then((data) => {
                if (data) {
                    this.lmsConfigurations = data.map(item => item.lmsConfiguration);
                    this.activeNavCss = `background-color: ${this.lmsConfigurations[0].SubTabs_Color__c}`;
                    this.tabsLoaded = true;
                    this.applyStyles();
                }
            })
            .catch((error) => {
                this.error = error;
                console.error('Error fetching styles:', this.error);
            });
    }

    applyStyles() {
        this.tabs = this.tabs.map(tab => ({
            ...tab,
            style: tab.class.includes('slds-is-active') ? this.activeNavCss : ''
        }));
    }

    navigateToUrl(url, activeTab) {
        const separator = url.includes('?') ? '&' : '?';
        this[NavigationMixin.Navigate]({
            type: 'standard__webPage',
            attributes: {
                url: `${url}${separator}activeTab=${activeTab}`
            }
        });
    }
}