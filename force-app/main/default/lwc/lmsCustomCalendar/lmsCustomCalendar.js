import { LightningElement, track, api } from 'lwc';
export default class LmsCustomCalendar extends LightningElement {
    @track currentYear;
    @track currentMonth;
    @track currentDate;
    @track currentMonthString;
    @track dates = [];
    //@track calendarEvents;
    courseName;
    @track top;
    modifiedCourseName;
    @track eventPosition = { top: '0px', left: '0px' };
    showEventDetails = false;

    _calendarEvents

    @api
    get calendarEvents() {
        return this._calendarEvents;
    }
    set calendarEvents(value) {
        if (value) {
            this._calendarEvents = value;
            this.addEvents(this._calendarEvents);
        }
    }

    months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    connectedCallback() {
        const today = new Date();
        this.currentYear = today.getFullYear();
        this.currentMonth = today.getMonth();
        this.currentDate = today.getDate();
        this.generateCalendar();
        // this.getEnrolledCourseDetails();
    }

    generateCalendar() {
        const lastDateOfMonth = new Date(this.currentYear, this.currentMonth + 1, 0).getDate();
        const firstDayOfMonth = new Date(this.currentYear, this.currentMonth, 1).getDay();
        const lastDayOfPreviousMonth = new Date(this.currentYear, this.currentMonth, 0).getDate();

        //console.log('@@@@@lastDateOfMonth', lastDateOfMonth ,"lastDayOfMonth @@@@@@@2" ,lastDayOfMonth)
        const datesArray = [];


        //add previous month dates before active month starting
        for (let i = 1; i <= firstDayOfMonth; i++) {
            datesArray.push({
                day: lastDayOfPreviousMonth - firstDayOfMonth + i,
                isCurrentDate: false,
                isActiveMonth: false,
            });
        }

        // Add the days of the current month
        for (let i = 1; i <= lastDateOfMonth; i++) {
            // console.log('days', i)
            datesArray.push({
                day: i,
                isCurrentDate: i === this.currentDate && this.currentMonth === new Date().getMonth() && this.currentYear === new Date().getFullYear(),
                isActiveMonth: true,

            });
        }

        //add next month date in active month
        const totalDaysInCalendar = Math.ceil(datesArray.length / 7) * 7;
        let firstDay = 1;

        for (let i = datesArray.length; i < totalDaysInCalendar; i++) {
            datesArray.push({
                day: firstDay,
                isCurrentDate: false,
                isActiveMonth: false,
            });
            firstDay++;
        }

        this.currentMonthString = this.months[this.currentMonth];
        this.dates = datesArray;

    }

    previousMonthHandler() {
        if (this.currentMonth === 0) {
            this.currentMonth = 11;
            this.currentYear -= 1;
        } else {
            this.currentMonth -= 1;
        }
        this.generateCalendar();
        this.addEvents(this._calendarEvents);
    }

    nextMonthHandler() {
        if (this.currentMonth === 11) {
            this.currentMonth = 0;
            this.currentYear += 1;
        } else {
            this.currentMonth += 1;
        }
        this.generateCalendar();
        this.addEvents(this._calendarEvents);
    }


    addEvents(events) {
        events.forEach((event) => {
            const eventDate = new Date(event.enrollmentDate);
            const eventDay = eventDate.getDate();
            const eventMonth = eventDate.getMonth();
            const eventYear = eventDate.getFullYear();

            // Find the event date
            this.dates.forEach((date) => {
                if (
                    date.isActiveMonth &&
                    date.day === eventDay &&
                    this.currentMonth === eventMonth &&
                    this.currentYear === eventYear
                ) {
                    // Add event 
                    date.events = [...(date.events || []), event.courseName];
                }
            });
        });

        //console.log('Updated Dates:', JSON.stringify(this.dates));
    }

    showEvent(event) {
        this.courseName = event.currentTarget.dataset.id;

        if (!this.courseName) return;


        let eventDetail = this.template.querySelector('.event-details');

        if (!eventDetail) {
            //this.modifiedCourseName = this.courseName.split(',')
            //console.log('this.modifiedCourseName',JSON.stringify(this.modifiedCourseName))

            this.modifiedCourseName = this.courseName.split(',').map(name => {
                name = name.trim();
                return name.length > 33 ? name.slice(0, 30) + '...' : name;
            });


        }





        const listItem = event.currentTarget;
        const listItemRect = listItem.getBoundingClientRect();
        const calendar = this.template.querySelector('.calendar');
        const calendarRect = calendar.getBoundingClientRect();

        this.eventPosition = {
            top: `${listItemRect.bottom - calendarRect.top + 5}px`,
            left: `0px`,
        };

        this.showEventDetails = true;
    }

    removeEventInfo() {
        this.showEventDetails = false;
        this.modifiedCourseName = ''
    }

    get eventStyle() {
        return `top: ${this.eventPosition.top}; left: ${this.eventPosition.left};`;
    }




}