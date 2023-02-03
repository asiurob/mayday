import { Component, EventEmitter, Input, Output } from '@angular/core';
import { IDataset } from '../dashboard.component';

@Component({
  selector: 'udl-dataset',
  templateUrl: './dataset.component.html',
  styleUrls: ['./dataset.component.scss']
})
export class DatasetComponent {

  @Input() dataset!: IDataset;
  constructor() { }
}
