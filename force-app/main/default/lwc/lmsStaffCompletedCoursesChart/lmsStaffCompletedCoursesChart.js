import { LightningElement, wire, api } from 'lwc';

import { loadScript } from 'lightning/platformResourceLoader';
import ChartJS from '@salesforce/resourceUrl/ChartJS';

export default class LmsStaffCompletedCoursesChart extends LightningElement {
    @api staffChartRecord;
    staffNames = [];
    completedCounts = [];
    chart;
    chartInitialized = false;

    connectedCallback() {
        if (this.staffChartRecord) {
            this.staffNames = this.staffChartRecord.map(item => item.staffName);
            this.completedCounts = this.staffChartRecord.map(item => item.completedCount);

            // Only initialize chart if Chart.js is loaded
            if (this.chartInitialized) {
                this.initializeChart();
            }
        } 
    }
    //    @wire(getCompletedCoursesData)
    // wiredCompletedCourses({ error, data }) {
    //     if (data) {
    //         this.staffNames = data.map(item => item.staffName);
    //         this.completedCounts = data.map(item => item.completedCount);

    //         // Only initialize chart if Chart.js is loaded
    //         if (this.chartInitialized) {
    //             this.initializeChart();
    //         }
    //     } else if (error) {
    //         console.error('Error fetching data:', error);
    //     }
    // }

    renderedCallback() {
        if (!this.chartInitialized) {
            this.chartInitialized = true;
            loadScript(this, ChartJS)
                .then(() => {
                    console.log('Chart.js loaded');
                    // Initialize chart if data is ready
                    if (this.staffNames.length) {
                        this.initializeChart();
                    }
                })
                .catch((error) => {
                    console.error('Error loading Chart.js:', error);
                });
        }
    }

    initializeChart() {
        if (this.chart || !this.staffNames.length) {
            return;
        }

        const ctx = this.template.querySelector('canvas').getContext('2d');
        this.chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: this.staffNames,
                datasets: [
                    {
                        label: 'Completed Courses',
                        data: this.completedCounts,
                        backgroundColor: 'blue'
                    }
                ]
            },
            options: {
                indexAxis: 'y', // Horizontal bar chart
                responsive: true,
                plugins: {
                    legend: {
                        display: false
                    },
                    title: {
                        display: true,
                        text: 'Staff with the Most Completed Courses'
                    }
                },
                scales: {
                    x: {
                        ticks: {
                            min: 2, // Start the x-axis at 5
                            stepSize: 2 // Increment by 5
                        }
                    }
                }
            }
        });
    }
}