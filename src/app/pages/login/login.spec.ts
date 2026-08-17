import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Login } from './login';
import { ToastrService } from 'ngx-toastr';
import { vi } from 'vitest';
import { provideRouter } from '@angular/router';

// TestBed = a tool that builds a fake mini-version of your app, just big enough to create one component in isolation.
// ComponentFixture = a wrapper around your component once it's created, that lets you inspect it (check its properties, trigger its methods, etc.)
// describe is just a way of grouping tests together with a label. It doesn't test anything by itself — it's like a folder name. Everything related to testing the Login component goes inside these curly braces.

describe('Login', () => {
    //two empty variable
    let component: Login;
    let fixture: ComponentFixture<Login>;

    //"run this block of code before every single test in this file."
    //every test needs a fresh, clean component to test against, so before each test, rebuild everything from scratch.
    beforeEach(async () => {
        const toastrSpy = {
            success: vi.fn(),
            error: vi.fn()
        };
        await TestBed.configureTestingModule({

            imports: [Login],
            providers: [
                { provide: ToastrService, useValue: toastrSpy },
                 provideRouter([])
            ]
        }).compileComponents();

        // creates a real instance of your Login component,
        fixture = TestBed.createComponent(Login);
        // the actual Login object itself
        component = fixture.componentInstance;
        //untill here nothing has tested yet.
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

        it('should set an error when email is empty', () => {
            component.email = '';
            component.validateEmail();
            expect(component.emailError).toBe('Email is required.');
        });

        it('should NOT set an error when email is filled', () => {
            component.email = 'test@careinsurance.ca';
            component.validateEmail();
            expect(component.emailError).toBe('');
        });

    //     it('should error when password is empty', () => {
    //         component.password = '';
    //         component.validatePassword();
    //         expect(component.passwordError).toBe('Password is required.');
    //     });

    //     it('should error when password is too short', () => {
    //         component.password = 'Ab1@';
    //         component.validatePassword();
    //         expect(component.passwordError).toBe('Password must be at least 8 characters.');
    //     });

    //     it('should error when password does not match required format', () => {
    //         component.password = 'alllowercase1@';
    //         component.validatePassword();
    //         expect(component.passwordError).toBe('Invalid password format.');
    //     });

    //     it('should have no error for a valid password', () => {
    //         component.password = 'Valid1@Pass';
    //         component.validatePassword();
    //         expect(component.passwordError).toBe('');
    //     });
});