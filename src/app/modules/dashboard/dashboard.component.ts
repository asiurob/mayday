import { ChangeDetectorRef, Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import {MediaMatcher} from '@angular/cdk/layout';
import {CdkDragDrop, moveItemInArray} from '@angular/cdk/drag-drop';
import * as moment from 'moment';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { MatSidenav } from '@angular/material/sidenav';
import { Router } from '@angular/router';
import { SoapParameters, UdlService } from './udl-service.service';

@Component({
  selector: 'udl-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {

  mobileQuery: MediaQueryList;
  private _mobileQueryListener: () => void;
  public datasets: IDataset[] = [];
  public filters: any[] = [];
  public firstJoin: boolean = false;
  public loading: boolean = false;
  @ViewChild('filterNav') public filterNav?: MatSidenav;

  range = new FormGroup({
    start: new FormControl<Date | null>(null, [Validators.required]),
    end: new FormControl<Date | null>(null, [Validators.required]),
  });

  public filtersFormGroup: FormGroup = new FormGroup({});

  constructor(
    private changeDetectorRef: ChangeDetectorRef,
    private media: MediaMatcher,
    private router: Router,
    private udlService: UdlService

  ) {
    this.mobileQuery = media.matchMedia('(max-width: 768px)');
    this._mobileQueryListener = () => changeDetectorRef.detectChanges();
    this.mobileQuery.addEventListener('change', this._mobileQueryListener);
  }

  ngOnDestroy(): void {
    this.mobileQuery.removeEventListener('change', this._mobileQueryListener);
  }

  ngOnInit(): void {
    this.loadFiltersConfiguration();
    this.firstJoin = true;
  }


  drop(event: CdkDragDrop<IDataset[]>) {
    moveItemInArray(this.datasets, event.previousIndex, event.currentIndex);
  }

  applyFilters(): void {
    const parameters = Object.keys(this.filtersFormGroup.value)
    .map(key => ({ key, value: this.filtersFormGroup.value[key] }))
    .filter( param => param.value !== null && param.value !== undefined && param.value !== '' )

    parameters.push({ key: 'fechai', value: moment(this.range.value.start).format('YYYY/MM/DD') });
    parameters.push({ key: 'fechaf', value: moment(this.range.value.end).format('YYYY/MM/DD') });

    const params: SoapParameters = {
      method: 'CargaTablas',
      parameters,
    };
    const data = this.udlService.getChartsData( params );

    if( this.range.valid && this.filtersFormGroup.get('dateRange')?.valid ) {
      this.loading = true;
        setTimeout(() => {
          this.firstJoin = false;
          this.filterNav?.toggle();
          this.datasets = [];
          for (let i = 1; i < 5; i++) {
            let dataset = this.buildDataset(i);
            this.datasets.push(dataset);
          }
          this.loading = false;
      }, 2000)
    }
  }

  disableFilters(): boolean | undefined {
    if( this.range && this.filtersFormGroup.get('intervalo') ) {
      return this.range.invalid || this.filtersFormGroup.get('intervalo')?.invalid;
    } else {
      return true;
    }
  }

  async loadFiltersConfiguration(): Promise<void> {
    this.loading = true;
    const filters = await this.udlService.getFilters('CargaFiltros')
    this.loading = false;
    if( filters && filters.length > 0 ) {
      filters
      .map( filter => {
        filter.formControl = filter.key;
        filter.inputType = 'select';
        filter.multiple = true;
        filter.required = false;
        filter.label = filter.name;
        return filter;
      })
      const defaultFilter = {
        formControl: 'intervalo',
        inputType: 'select',
        label: '¿Cómo ver?',
        multiple: false,
        required: true,
        options: [
          { value: 'dia', label: 'Días' },
          { value: 'semana', label: 'Semanas' },
          { value: 'mes', label: 'Meses' },
          { value: 'anio', label: 'Años' },
        ]
      };
      this.filters.push( defaultFilter, ...filters );
      this.createFormFilters( this.filters );
    }
  }


  createFormFilters( filters: any[] ): void {
    filters.forEach(filter => {
      const required = filter.required ? [Validators.required] : [];
      this.filtersFormGroup.addControl(
        filter.formControl, new FormControl(filter.defaultValue, required)
      )
    })
  }

  resetFilters(): void {
    this.datasets = [];
    this.firstJoin = true;
    this.filtersFormGroup.reset();
    this.range.reset();
  }

  selectedPoint( point: { x: number, y: number } ): void {
    const incomingDate = moment(point.x).add(1, 'day').format('YYYY-MM-DD');
    const data = this.datasets
    .filter(dataset => dataset.selected)
    .map( dataset => dataset.data.filter( data => data.date === incomingDate ) )
    console.log( data );
  }

  logout(): void {
    this.router.navigate(['/login']);
  }


  /**
   * DUMMY DATA
   */

   addDataset(): void {
    let dataset = this.buildDataset(this.datasets.length + 1);
    this.datasets.push(dataset);
  }

  activeCharts(): IDataset[] {
    return this.datasets.filter(d => d.selected)
  }

  buildDataset( number: number ): IDataset {
    return {
      id: number,
      name: `Conjunto ${number}`,
      selected: false,
      data: this.buildRandomData().sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    }
  }

  buildRandomData(): IDatasetData[] {
    const { start, end } = this.range.value;
    if( start && end ) {
      let data: IDatasetData[] = [];
      const limit = Math.floor(Math.random() * 100);

      for (let i = 0; i < limit; i++) {
        data.push({
          date: moment( new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())) )
          .format('YYYY-MM-DD'),
          value: Math.floor(Math.random() * 10000)
        })
      }
      return data;
    }
    return [];
  }
}


export interface IDataset {
  id: number;
  name: string;
  selected: boolean;
  data: IDatasetData[];
}

export interface IDatasetData {
  date: Date | string;
  value: number;
}

/*
  http://201.168.154.186/WebServices/Wsinfo/Service1.svc
  Parametro: hash_code = d@t0s2211ñQ
  Método: CargaFiltros
*/
