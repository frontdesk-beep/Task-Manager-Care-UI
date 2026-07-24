import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Remarks } from './remarks';

describe('Remarks', () => {
  let component: Remarks;
  let fixture: ComponentFixture<Remarks>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Remarks],
    }).compileComponents();

    fixture = TestBed.createComponent(Remarks);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
