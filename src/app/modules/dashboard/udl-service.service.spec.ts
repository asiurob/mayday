import { TestBed } from '@angular/core/testing';

import { UdlService } from './udl-service.service';

describe('UdlService', () => {
  let service: UdlService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UdlService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
