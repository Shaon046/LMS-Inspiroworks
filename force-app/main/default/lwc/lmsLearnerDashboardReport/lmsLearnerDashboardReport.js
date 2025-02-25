import { LightningElement, api } from 'lwc';
import { loadScript } from 'lightning/platformResourceLoader';
import ChartJS from '@salesforce/resourceUrl/ChartJS';

export default class LmsLearnerDashboardReport extends LightningElement {
    chart;
    chartjsInitialized = false;
    @api reportData;
    labels;
    notStarted = [];
    inProgress = [];
    completed = [];

    connectedCallback() {
        if (this.chartjsInitialized) {
            return;
        }
        this.chartjsInitialized = true;
        this.labels = Object.keys(this.reportData);

        this.labels.forEach(label => {
            this.notStarted.push(this.reportData[label][0])
        });

        this.labels.forEach(label => {
            this.inProgress.push(this.reportData[label][1])
        });
        
        this.labels.forEach(label => {
            this.completed.push(this.reportData[label][2])
        });

        loadScript(this, ChartJS)
            .then(() => {
                this.initializeChart();
            })
            .catch(error => {
                console.error('Error loading ChartJS', error);
            });
    }

    initializeChart() {
        if(this.reportData){
            
            console.log(JSON.stringify(Object.keys(this.reportData)));
            console.log(JSON.stringify(this.reportData));

        }
        const ctx = this.template.querySelector('canvas').getContext('2d');



        // Dummy data for the chart
        const data = {
            labels: this.labels,
            datasets: [
                {
                    label: 'Not Started',
                    backgroundColor: '#0273bf',
                    borderRadius: 10,
                    barPercentage : 0.75,
                    categoryPercentage : 0.4,
                    data : this.notStarted
                },
                {
                    label: 'In Progress',
                    backgroundColor: '#009aff',
                    borderRadius: 10,
                    barPercentage : 0.75,
                    categoryPercentage : 0.4,
                    data : this.inProgress
                },
                {
                    label: 'Completed',
                    backgroundColor: '#83ceff',
                    borderRadius: 10,
                    barPercentage : 0.75,
                    categoryPercentage : 0.4,
                    data : this.completed
                }
            ]
        };

        const options = {
            scales: {
                x: {
                    grid: {
                        display: false,
                    },
                },
                y: {
                    beginAtZero: true
                }
            },
            responsive: true,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        usePointStyle: false,
                        boxWidth: 10,
                        padding: 10
                    },
                },
                title: {
                    display: true,
                    text: 'Teacher Professional Development Report'
                }
            }
        };

        this.chart = new Chart(ctx, {
            type: 'bar',
            data: data,
            options: options
        });
    }
}