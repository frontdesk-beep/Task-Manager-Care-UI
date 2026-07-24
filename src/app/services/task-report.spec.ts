import { TestBed } from '@angular/core/testing';

import { TaskReport } from './task-report';

describe('TaskReport', () => {
  let service: TaskReport;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TaskReport);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
