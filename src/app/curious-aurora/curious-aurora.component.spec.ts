import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CuriousAuroraComponent } from './curious-aurora.component';

describe('CuriousAuroraComponent', () => {
  let component: CuriousAuroraComponent;
  let fixture: ComponentFixture<CuriousAuroraComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CuriousAuroraComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CuriousAuroraComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
