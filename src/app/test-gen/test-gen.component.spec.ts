import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TestGenComponent } from './test-gen.component';

describe('TestGenComponent', () => {
  let component: TestGenComponent;
  let fixture: ComponentFixture<TestGenComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TestGenComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TestGenComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
