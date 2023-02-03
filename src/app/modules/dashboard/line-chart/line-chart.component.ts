import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { Chart } from 'angular-highcharts';
import { Point } from 'highcharts';
import { IDataset } from '../dashboard.component';

@Component({
  selector: 'udl-line-chart',
  templateUrl: './line-chart.component.html',
  styleUrls: ['./line-chart.component.scss']
})
export class LineChartComponent implements OnInit {

  @Input() dataset!: IDataset;
  @Output() selectedPoint: EventEmitter<{ x: number, y: number }> = new EventEmitter<{ x: number, y: number }>();
  public chart!: Chart;

  ngOnInit(): void {
    const that = this;
    this.chart = new Chart({
      chart: { type: 'line' },
      legend: { enabled: false },
      yAxis: {
        title: { text: undefined },
        gridLineWidth: 0,
      },
      title: {
        text: this.dataset.name,
        align: 'left',
        style: {
          fontWeight: 'bolder',
          fontSize: '0.8rem',
          underline: 'none',
        }
      },
      credits: { enabled: false },
      xAxis: {
        type: 'datetime',
        crosshair: true,
      },
      plotOptions: {
        series: {
          // pointInterval: 3600 * 1000,
        }
      },

      series: [{
          name: this.dataset.name,
          type: 'line',
          color: '#4c4c4c',
          data: this.dataset.data.map(d => [new Date(d.date).getTime(), d.value]),
          point: {
            events: {
              mouseOver: function() {
                that.synchronize(this)
              }
            }
          },
        }],
      responsive: {
        rules: [{
            condition: {
                maxWidth: 768
            },
            chartOptions: {
                legend: {
                    layout: 'horizontal',
                    align: 'center',
                    verticalAlign: 'bottom'
                }
            }
        }]
    }
    });
  }

   synchronize(point: Point): void {
    const { x = 0, y = 0 } = point;
    // this.selectedPoint.emit({ x, y });
  }

}
