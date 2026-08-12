import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of} from 'rxjs';
import { Resetpassword } from './resetpassword';

describe('Resetpassword', () => {
  let component: Resetpassword;
  let fixture: ComponentFixture<Resetpassword>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Resetpassword],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            queryParams: of({ token: 'test-token' })
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Resetpassword);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
