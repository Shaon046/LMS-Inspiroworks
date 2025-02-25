import { LightningElement, api } from 'lwc';
import { loadScript } from 'lightning/platformResourceLoader';
import ChartJS from '@salesforce/resourceUrl/ChartJS';

export default class LmsDashboardMonthlyProgressReport extends LightningElement {
    chart;
    chartjsInitialized = false;
    @api monthlyProgressData;
    labels = [];
    inProgress = [];
    registered = [];
    completed = [];

    connectedCallback() {
        console.log('from child ',this.monthlyProgressData);
        if (this.chartjsInitialized) {
            return;
        }
        this.chartjsInitialized = true;
        
        let sortedKeys = Object.keys(this.monthlyProgressData).sort((a, b) => {
            const [yearA, monthA] = a.split('-').map(Number);
            const [yearB, monthB] = b.split('-').map(Number);
            return yearA === yearB ? monthA - monthB : yearA - yearB;
        });
        sortedKeys = sortedKeys.length > 4 ? sortedKeys.slice(-4) : sortedKeys;

        sortedKeys.forEach(key => {
            this.labels.push(this.formatMonthYear(key));
            this.inProgress.push(this.monthlyProgressData[key]["In Progress"] || 0);
            this.registered.push(this.monthlyProgressData[key]["Registered"] || 0);
            this.completed.push(this.monthlyProgressData[key]["Completed"] || 0);
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
        const ctx = this.template.querySelector('canvas').getContext('2d');

        const data = {
            labels: this.labels,
            datasets: [
                {
                    label: 'Completed',
                    backgroundColor: '#83ceff',
                    data: this.completed
                },
                {
                    label: 'In Progress',
                    backgroundColor: '#009aff',
                    data: this.inProgress
                },
                {
                    label: 'Enrolled',
                    backgroundColor: '#0273bf',
                    data: this.registered
                }
            ]
        };

        const options = {
            scales: {
                x: {
                    stacked: true,
                    grid: { display: false }
                },
                y: {
                    stacked: true,
                    beginAtZero: true,
                    ticks: { stepSize: 1 }
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
                    }
                },
                title: {
                    display: true,
                    text: 'Monthly Course Summary Report'
                }
            }
        };

        this.chart = new Chart(ctx, {
            type: 'bar',
            data: data,
            options: options
        });
    }

    formatMonthYear(monthYear) {
        const [year, month] = monthYear.split('-');
        const months = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        return months[parseInt(month, 10) - 1];
    }
}