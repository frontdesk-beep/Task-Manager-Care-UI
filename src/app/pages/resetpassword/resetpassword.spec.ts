import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of} from 'rxjs';
import { Resetpassword } from './resetpassword';
import {provideAnimations} from '@angular/platform-browser/animations';
import { ToastrService } from 'ngx-toastr';
import { vi } from 'vitest';

describe('Resetpassword', () => {
  let component: Resetpassword;
  let fixture: ComponentFixture<Resetpassword>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Resetpassword],
      providers: [
         provideAnimations(),
        {
          provide: ActivatedRoute,
          useValue: {
            queryParams: of({ token: 'test-token' })
          }
        },
         {
         provide: ToastrService,
       useValue: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() }
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
