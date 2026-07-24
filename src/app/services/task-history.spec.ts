import { TestBed } from '@angular/core/testing';

import { TaskHistory } from './task-history';

describe('TaskHistory', () => {
  let service: TaskHistory;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TaskHistory);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
