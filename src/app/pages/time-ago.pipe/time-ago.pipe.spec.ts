import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TimeAgoPipe } from './time-ago.pipe';

describe('TimeAgoPipe', () => {
  let component: TimeAgoPipe;
  let fixture: ComponentFixture<TimeAgoPipe>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TimeAgoPipe],
    }).compileComponents();

    fixture = TestBed.createComponent(TimeAgoPipe);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
