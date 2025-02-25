import { LightningElement, api } from 'lwc';
export default class LmsCalendarEvents extends LightningElement {
    courseDetails = [];
    filterValue = '1week';
    _calendarEvents

    @api
    get calendarEvents() {
        return this._calendarEvents;
    }
    set calendarEvents(value) {
        if (value) {
            this._calendarEvents = value;
            this.courseDetails = this._calendarEvents;
        }
    }



    get filteredCourses() {
        const now = new Date();
        let filtered = this.courseDetails.filter(course => {
            const courseDate = new Date(course.enrollmentDate);
            //  console.log('courseDate', courseDate, 'now', now)
            if (courseDate >= now) {

                const diffDays = (courseDate - now) / (1000 * 3600 * 24);
                switch (this.filterValue) {
                    case '1week':
                        return diffDays <= 7;

                    case '2weeks':
                        return diffDays <= 14;

                    case '1month':
                        return diffDays <= 30;

                    default:
                        return true;
                }
            }
        });

        filtered = filtered.map(obj => ({
            ...obj,
            courseName: obj.courseName.length > 33 ? obj.courseName.slice(0, 30) + '...' : obj.courseName
        }));

        return filtered;
    }


    handleFilterChange(event) {
        this.filterValue = event.target.value;
    }
}